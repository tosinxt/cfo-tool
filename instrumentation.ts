const REQUIRED_ENV_VARS = [
  "ANTHROPIC_API_KEY",
  "FIREBASE_SERVICE_ACCOUNT_JSON",
  "NEXT_PUBLIC_APP_URL",
  "RESEND_API_KEY",
  "RESEND_FROM_ADDRESS",
  "ADMIN_NOTIFICATION_EMAILS",
] as const;

function checkEnvVars() {
  if (process.env.DEMO_MODE === "true") return;
  const missing = REQUIRED_ENV_VARS.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Add them to .env.local or your deployment environment."
    );
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    checkEnvVars();

    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.2,
      enabled: process.env.NODE_ENV === "production" || !!process.env.SENTRY_DEBUG,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.2,
      enabled: process.env.NODE_ENV === "production" || !!process.env.SENTRY_DEBUG,
    });
  }
}
