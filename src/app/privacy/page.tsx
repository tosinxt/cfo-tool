import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How PitchReady collects, uses, and protects your data.",
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = "June 11, 2025";
const COMPANY = "PitchReady";
const CONTACT_EMAIL = "privacy@pitchready.co";

const sections = [
  {
    title: "Information we collect",
    content: [
      {
        heading: "Payment information",
        body: "When you purchase the Service, Stripe collects your name, email address, and payment card details on our behalf. We receive a confirmation and your email address — we never see or store raw card numbers.",
      },
      {
        heading: "Intake form data",
        body: "You provide company information including financial projections, revenue figures, team details, and strategic plans. This information is necessary to deliver the Service and is treated as confidential.",
      },
      {
        heading: "Usage data",
        body: "We may automatically collect standard server log data (IP address, browser type, pages visited) for security and performance monitoring.",
      },
    ],
  },
  {
    title: "How we use your information",
    list: [
      "To deliver the pitch deck and written report you purchased.",
      "To communicate with you about your engagement — status updates and delivery.",
      "To monitor and improve the Service via error tracking (Sentry).",
      "To comply with legal obligations.",
    ],
    note: "We do not sell your data to third parties. We do not use your financial data to train AI models beyond generating your deliverables.",
  },
  {
    title: "Sub-processors",
    body: "Your data is processed by the following third-party services:",
    list: [
      "Google Firebase / Firestore — engagement data and file storage (United States).",
      "Stripe — payment processing. Stripe's privacy policy governs payment data.",
      "Anthropic — AI-assisted draft generation. Intake data is sent to Anthropic's API to produce your deliverables.",
      "Resend — transactional email (confirmations, delivery notifications).",
      "Sentry — error monitoring. May receive anonymised stack traces containing engagement IDs.",
    ],
  },
  {
    title: "Data retention",
    body: "We retain engagement data for 24 months after delivery, or until you request deletion. Stripe retains payment records per their legal obligations.",
  },
  {
    title: "Your rights",
    body: `You may request access to, correction of, or deletion of your personal data at any time by emailing ${CONTACT_EMAIL}. We will respond within 30 days. If you are located in the EEA or UK, you have additional rights under GDPR / UK GDPR, including the right to lodge a complaint with your local supervisory authority.`,
    email: CONTACT_EMAIL,
  },
  {
    title: "Security",
    body: "We use industry-standard measures including TLS encryption in transit, token-authenticated intake links, and Firebase Security Rules to limit data access. No method of transmission or storage is 100% secure.",
  },
  {
    title: "Children",
    body: "The Service is intended for business use by adults. We do not knowingly collect data from anyone under 18.",
  },
  {
    title: "Changes to this policy",
    body: "We may update this policy. Material changes will be communicated by email to the address associated with your engagement, or by posting a notice on this page with an updated effective date.",
  },
];

export default function PrivacyPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--color-cream, #fafaf8)",
        fontFamily: "var(--font-af)",
      }}
    >
      {/* Nav */}
      <div style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", padding: "0 24px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0', fontSize: "15px", fontWeight: 400, letterSpacing: "-0.3px", color: "var(--color-ink, #111)" }}>
              Pitch<span style={{ color: "var(--color-hudson-blue, #0081c0)" }}>Ready</span>
            </span>
          </Link>
          <Link href="/terms" style={{ fontSize: "13px", color: "var(--color-steel, #4a4a4a)", textDecoration: "none" }}>
            Terms of Service →
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "64px 24px 96px" }}>
        {/* Header */}
        <div style={{ marginBottom: "48px", paddingBottom: "32px", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-hudson-blue, #0081c0)", marginBottom: "12px" }}>
            Legal
          </p>
          <h1 style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0', fontSize: "clamp(32px, 6vw, 44px)", fontWeight: 400, lineHeight: 1.08, letterSpacing: "-0.8px", color: "var(--color-ink, #111)", marginBottom: "12px" }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-steel, #666)" }}>
            Effective date: {EFFECTIVE_DATE} &nbsp;·&nbsp; {COMPANY}
          </p>
        </div>

        {/* Intro */}
        <p style={{ fontSize: "15px", lineHeight: 1.75, color: "var(--color-steel, #555)", marginBottom: "40px" }}>
          {COMPANY} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates PitchReady
          (the &ldquo;Service&rdquo;). This Privacy Policy explains what information we collect,
          how we use it, and the choices you have.
        </p>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          {sections.map((s, i) => (
            <section key={i} style={{ paddingTop: "32px", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 600, color: "var(--color-ink, #111)", letterSpacing: "-0.2px", marginBottom: "14px" }}>
                {i + 1}. {s.title.charAt(0).toUpperCase() + s.title.slice(1)}
              </h2>

              {"content" in s && s.content && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {s.content.map((c, ci) => (
                    <p key={ci} style={{ fontSize: "14px", lineHeight: 1.75, color: "var(--color-steel, #555)" }}>
                      <strong style={{ color: "var(--color-ink, #111)", fontWeight: 600 }}>{c.heading}. </strong>
                      {c.body}
                    </p>
                  ))}
                </div>
              )}

              {"body" in s && s.body && !("content" in s) && (
                <p style={{ fontSize: "14px", lineHeight: 1.75, color: "var(--color-steel, #555)", marginBottom: s.list ? "14px" : 0 }}>
                  {"email" in s
                    ? s.body.replace(s.email!, "").split(s.email!)[0]
                    : s.body}
                  {"email" in s && s.email && (
                    <>
                      <a href={`mailto:${s.email}`} style={{ color: "var(--color-hudson-blue, #0081c0)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
                        {s.email}
                      </a>
                      {s.body.split(s.email!)[1]}
                    </>
                  )}
                </p>
              )}

              {"list" in s && s.list && (
                <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {s.list.map((item, li) => (
                    <li key={li} style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--color-steel, #555)" }}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {"note" in s && s.note && (
                <p style={{ fontSize: "13px", lineHeight: 1.65, color: "var(--color-steel, #888)", marginTop: "12px", padding: "10px 14px", background: "rgba(0,129,192,0.05)", borderRadius: "6px", border: "1px solid rgba(0,129,192,0.12)" }}>
                  {s.note}
                </p>
              )}
            </section>
          ))}
        </div>

        {/* Contact footer */}
        <div style={{ marginTop: "56px", paddingTop: "32px", borderTop: "1px solid rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "6px" }}>
          <p style={{ fontSize: "13px", color: "var(--color-steel, #888)" }}>
            Questions about this policy?{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--color-hudson-blue, #0081c0)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
              {CONTACT_EMAIL}
            </a>
          </p>
          <p style={{ fontSize: "12px", color: "#b0b5b0" }}>
            © {new Date().getFullYear()} {COMPANY}. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
