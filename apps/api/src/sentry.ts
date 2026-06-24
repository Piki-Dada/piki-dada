import * as Sentry from '@sentry/node';

// No-ops until SENTRY_DSN is set, same placeholder-credential pattern used for
// Stripe/Flutterwave/Resend/Cloudinary/Firebase elsewhere in this app.
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({ dsn, tracesSampleRate: 0.1 });
}

export function captureException(error: unknown) {
  if (!process.env.SENTRY_DSN) return;
  Sentry.captureException(error);
}
