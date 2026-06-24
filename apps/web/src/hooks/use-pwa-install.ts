"use client";

import { useCallback, useEffect, useState } from "react";
import { canPrompt, isIOS, isInstalled, markInstalled, promptInstall } from "@/lib/pwa";

export function usePwaInstall() {
  const [installed, setInstalled] = useState(false);
  const [promptable, setPromptable] = useState(false);

  useEffect(() => {
    setInstalled(isInstalled());
    setPromptable(canPrompt());

    const handlePromptAvailable = () => setPromptable(canPrompt());
    const handleInstalled = () => {
      markInstalled();
      setInstalled(true);
      setPromptable(false);
    };

    window.addEventListener("pwa:prompt-available", handlePromptAvailable);
    window.addEventListener("app:pwa-installed", handleInstalled);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("pwa:prompt-available", handlePromptAvailable);
      window.removeEventListener("app:pwa-installed", handleInstalled);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const prompt = useCallback(async () => {
    const outcome = await promptInstall();
    return outcome;
  }, []);

  return { installed, promptable, isIOS: isIOS(), promptInstall: prompt };
}
