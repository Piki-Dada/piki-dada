export const PWA_STORAGE_KEY = "app_pwa_installed";
export const PWA_FIRST_DELAY = 60_000;
export const PWA_REPEAT_DELAY = 5 * 60_000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __pwaState?: { deferredPrompt: BeforeInstallPromptEvent | null };
  }
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PWA_STORAGE_KEY) === "1" || isStandalone();
  } catch {
    return isStandalone();
  }
}

export function markInstalled() {
  try {
    localStorage.setItem(PWA_STORAGE_KEY, "1");
  } catch {
    /* ignore storage errors */
  }
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function canPrompt(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.__pwaState?.deferredPrompt) || isIOS();
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const deferredPrompt = typeof window !== "undefined" ? window.__pwaState?.deferredPrompt : null;
  if (!deferredPrompt) return "unavailable";
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (window.__pwaState) window.__pwaState.deferredPrompt = null;
  return outcome;
}

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => undefined);
}

export const PUSH_SUBSCRIBED_KEY = "app_push_subscribed";

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function isPushSubscribed(): boolean {
  try {
    return localStorage.getItem(PUSH_SUBSCRIBED_KEY) === "1";
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

export async function subscribeToPush(
  fetchPublicKey: () => Promise<{ publicKey: string }>,
  postSubscription: (subscription: PushSubscriptionJSON) => Promise<void>,
): Promise<"granted" | "denied" | "unsupported"> {
  if (!isPushSupported()) return "unsupported";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const registration = await navigator.serviceWorker.ready;
  const { publicKey } = await fetchPublicKey();
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });
  await postSubscription(subscription.toJSON());

  try {
    localStorage.setItem(PUSH_SUBSCRIBED_KEY, "1");
  } catch {
    /* ignore storage errors */
  }
  return "granted";
}
