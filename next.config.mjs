import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSentryConfig(nextConfig, {
  // Suppresses source map upload logs during build
  silent: true,
  // Upload a larger set of source maps for prettier stack traces
  widenClientFileUpload: true,
  // Hides Sentry's Next.js plugin error overlay
  hideSourceMaps: true,
  // Disable ad-blocker-friendly tunnel (set tunnelRoute: "/monitoring" if needed)
  disableLogger: true,
  // Auto-instrument Next.js API routes
  autoInstrumentServerFunctions: true,
});
