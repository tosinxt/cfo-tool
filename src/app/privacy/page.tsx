import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Series A Pitch Tool",
  description: "How we collect, use, and protect your data.",
};

const EFFECTIVE_DATE = "June 4, 2025";
const COMPANY = "Erase Friction LLC";
const CONTACT_EMAIL = "privacy@seriesapitchtool.com";
const APP_NAME = "Series A Pitch Tool";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <div className="max-w-2xl mx-auto space-y-8 text-gray-700">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <p>
          {COMPANY} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the{" "}
          {APP_NAME} (the &ldquo;Service&rdquo;). This Privacy Policy explains what information
          we collect, how we use it, and the choices you have.
        </p>

        <Section title="1. Information We Collect">
          <p>
            <strong>Account &amp; payment information.</strong> When you purchase the Service,
            Stripe collects your name, email address, and payment card details. We receive a
            confirmation and the email address; we never see or store raw card numbers.
          </p>
          <p>
            <strong>Intake form data.</strong> You provide company information including financial
            projections, revenue figures, team details, and strategic plans. This information is
            necessary to deliver the Service.
          </p>
          <p>
            <strong>Usage data.</strong> We may automatically collect standard server log data
            (IP address, browser type, pages visited) for security and performance monitoring.
          </p>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide and deliver the pitch deck and financial report you purchased.</li>
            <li>To communicate with you about your engagement (status updates, delivery).</li>
            <li>To improve the Service and diagnose technical issues via error monitoring (Sentry).</li>
            <li>To comply with legal obligations.</li>
          </ul>
          <p>We do not sell your data to third parties. We do not use your financial data to train AI models beyond generating your deliverables.</p>
        </Section>

        <Section title="3. Data Storage &amp; Third-Party Services">
          <p>Your data is stored using the following sub-processors:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Google Firebase / Firestore</strong> — structured engagement data and file
              storage (Firebase Storage). Data is stored in the United States.
            </li>
            <li>
              <strong>Stripe</strong> — payment processing. Stripe&apos;s privacy policy governs
              payment data.
            </li>
            <li>
              <strong>Anthropic</strong> — AI-assisted draft generation. Intake data is sent to
              Anthropic&apos;s API to produce your deliverables. Anthropic&apos;s data-use policy
              applies.
            </li>
            <li>
              <strong>Resend</strong> — transactional email delivery (confirmations,
              notifications).
            </li>
            <li>
              <strong>Sentry</strong> — error monitoring. Sentry may receive anonymised stack
              traces that could include engagement IDs.
            </li>
          </ul>
        </Section>

        <Section title="4. Data Retention">
          <p>
            We retain engagement data for 24 months after delivery, or until you request deletion.
            Stripe retains payment records per their legal obligations.
          </p>
        </Section>

        <Section title="5. Your Rights">
          <p>
            You may request access to, correction of, or deletion of your personal data at any
            time by emailing{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">
              {CONTACT_EMAIL}
            </a>
            . We will respond within 30 days.
          </p>
          <p>
            If you are located in the European Economic Area or United Kingdom, you have
            additional rights under GDPR / UK GDPR, including the right to lodge a complaint with
            your local supervisory authority.
          </p>
        </Section>

        <Section title="6. Security">
          <p>
            We use industry-standard measures including TLS in transit, token-authenticated intake
            links, and Firebase Security Rules to limit data access. No method of transmission or
            storage is 100% secure; we cannot guarantee absolute security.
          </p>
        </Section>

        <Section title="7. Children">
          <p>
            The Service is intended for business use by adults. We do not knowingly collect data
            from anyone under 18.
          </p>
        </Section>

        <Section title="8. Changes to This Policy">
          <p>
            We may update this policy. Material changes will be communicated by email to the
            address associated with your engagement, or by posting a notice on this page with an
            updated effective date.
          </p>
        </Section>

        <Section title="9. Contact">
          <p>
            Questions? Email us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {children}
    </div>
  );
}
