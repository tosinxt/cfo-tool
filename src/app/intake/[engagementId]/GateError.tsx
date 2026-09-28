import Cloudscape from "@/components/forgeui/cloudscape";

/**
 * Shared access-denied screen for both intake surfaces (chat and form).
 */
export default function GateError({ message }: { message: string }) {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center px-6"
      style={{ fontFamily: "var(--font-af)" }}
    >
      <Cloudscape
        colorBottom="#a8c8e8"
        colorMid="#d4e8d4"
        colorTop="#e8e4f0"
        speed={1.2}
        height="100dvh"
        className="pointer-events-none"
        style={{ position: "fixed", inset: 0, zIndex: -1, width: "100vw", height: "100dvh" }}
      />
      <div className="relative w-full max-w-[400px] text-center">
        {/* Brand */}
        <div className="mb-10">
          <span
            className="text-[16px] font-[400] leading-none tracking-[-0.32px]"
            style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0', color: "var(--color-ink)" }}
          >
            Series A <span style={{ color: "var(--color-hudson-blue)" }}>HUB</span>
          </span>
        </div>

        {/* Icon */}
        <div
          className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "var(--color-linen)", border: "1px solid var(--color-sage)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-iron)" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
          </svg>
        </div>

        <h1
          className="mb-3 text-[28px] font-[400] leading-[1.1] tracking-[-0.56px]"
          style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0', color: "var(--color-ink)" }}
        >
          Access denied
        </h1>
        <p className="mb-8 text-[14px] leading-[1.6]" style={{ color: "var(--color-steel)" }}>
          {message}
        </p>
        <a
          href="mailto:support@pitchready.co"
          className="text-[14px] font-[500] underline underline-offset-4 transition-colors"
          style={{ color: "var(--color-iron)", textDecorationColor: "var(--color-sage)" }}
        >
          Contact support →
        </a>
      </div>
    </main>
  );
}
