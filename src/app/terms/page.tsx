import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing your use of PitchReady.",
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = "June 11, 2025";
const COMPANY = "PitchReady";
const CONTACT_EMAIL = "legal@pitchready.co";

const sections = [
  {
    title: "The Service",
    body: `${COMPANY} provides AI-assisted, CFO-reviewed pitch deck and written report preparation for founders raising a Series A round. The deliverables are advisory in nature and do not constitute financial, legal, or investment advice.`,
  },
  {
    title: "Eligibility",
    body: "You must be at least 18 years old and have the authority to enter into contracts on behalf of any company you represent. The Service is for business use only.",
  },
  {
    title: "Payment & fees",
    content: [
      {
        heading: "Pricing",
        body: "All fees are stated at checkout and charged via Stripe. Prices are in USD and exclusive of applicable taxes. Payment is due at the time of purchase.",
      },
      {
        heading: "Refunds",
        body: "We offer a full refund if you request it within 48 hours of purchase and before you have submitted your intake form. Once the intake form is submitted and work has begun, refunds are issued at our sole discretion.",
      },
    ],
  },
  {
    title: "Your data & content",
    content: [
      {
        heading: "Ownership",
        body: 'You retain all ownership rights to the data and content you provide ("Your Content"). By submitting Your Content, you grant us a limited, non-exclusive licence to process and use it solely to deliver the Service to you.',
      },
      {
        heading: "Accuracy",
        body: "You represent that Your Content is accurate to the best of your knowledge and that you have the right to share it with us.",
      },
    ],
  },
  {
    title: "Deliverables & intellectual property",
    content: [
      {
        heading: "Your deliverables",
        body: "Upon full payment and delivery, you own the pitch deck and report produced for you. We retain no rights to the final files.",
      },
      {
        heading: "Our platform",
        body: `The ${COMPANY} platform, software, branding, and any generic templates remain the exclusive property of ${COMPANY}.`,
      },
    ],
  },
  {
    title: "Confidentiality",
    body: "We treat Your Content as confidential. We will not disclose your financial data or company information to third parties except as required to deliver the Service (e.g., sending to our AI provider) or as required by law.",
  },
  {
    title: "Turnaround time",
    body: "We target delivery within 5–7 business days of intake submission. This is an estimate, not a guarantee. Delays caused by incomplete or inaccurate intake data are not our responsibility.",
  },
  {
    title: "Disclaimers",
    body: 'THE SERVICE IS PROVIDED "AS IS". WE MAKE NO WARRANTIES, EXPRESS OR IMPLIED, REGARDING THE ACCURACY, COMPLETENESS, OR FITNESS FOR A PARTICULAR PURPOSE OF THE DELIVERABLES. THE DELIVERABLES ARE NOT A GUARANTEE OF FUNDRAISING SUCCESS.',
    legal: true,
  },
  {
    title: "Limitation of liability",
    body: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, ${COMPANY.toUpperCase()}'S TOTAL LIABILITY ARISING OUT OF OR RELATING TO THE SERVICE SHALL NOT EXCEED THE FEES YOU PAID IN THE 12 MONTHS PRECEDING THE CLAIM. IN NO EVENT SHALL WE BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.`,
    legal: true,
  },
  {
    title: "Governing law",
    body: "These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict-of-law principles. Any disputes shall be resolved in the courts located in Delaware.",
  },
  {
    title: "Changes to these terms",
    body: "We may update these Terms at any time. We will provide at least 14 days' notice by email for material changes. Continued use of the Service after changes take effect constitutes acceptance.",
  },
];

export default function TermsPage() {
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
          <Link href="/privacy" style={{ fontSize: "13px", color: "var(--color-steel, #4a4a4a)", textDecoration: "none" }}>
            Privacy Policy →
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
            Terms of Service
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-steel, #666)" }}>
            Effective date: {EFFECTIVE_DATE} &nbsp;·&nbsp; {COMPANY}
          </p>
        </div>

        {/* Intro */}
        <p style={{ fontSize: "15px", lineHeight: 1.75, color: "var(--color-steel, #555)", marginBottom: "40px" }}>
          Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before using{" "}
          {COMPANY}. By purchasing or using the Service, you agree to be bound by these Terms.
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
                <p style={{
                  fontSize: "14px",
                  lineHeight: 1.75,
                  color: "legal" in s && s.legal ? "var(--color-steel, #888)" : "var(--color-steel, #555)",
                  fontVariant: "legal" in s && s.legal ? "all-small-caps" : undefined,
                  letterSpacing: "legal" in s && s.legal ? "0.02em" : undefined,
                  padding: "legal" in s && s.legal ? "12px 14px" : undefined,
                  background: "legal" in s && s.legal ? "rgba(0,0,0,0.03)" : undefined,
                  borderRadius: "legal" in s && s.legal ? "6px" : undefined,
                  border: "legal" in s && s.legal ? "1px solid rgba(0,0,0,0.07)" : undefined,
                }}>
                  {s.body}
                </p>
              )}
            </section>
          ))}
        </div>

        {/* Contact footer */}
        <div style={{ marginTop: "56px", paddingTop: "32px", borderTop: "1px solid rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "6px" }}>
          <p style={{ fontSize: "13px", color: "var(--color-steel, #888)" }}>
            Questions about these Terms?{" "}
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
