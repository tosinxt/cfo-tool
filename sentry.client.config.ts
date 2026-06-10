import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  // Disable in development unless SENTRY_DEBUG is set
  enabled: process.env.NODE_ENV === "production" || !!process.env.SENTRY_DEBUG,
  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
});
