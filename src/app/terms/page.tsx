import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Series A Pitch Tool",
  description: "Terms governing your use of the Series A Pitch Tool.",
};

const EFFECTIVE_DATE = "June 4, 2025";
const COMPANY = "Erase Friction LLC";
const CONTACT_EMAIL = "legal@seriesapitchtool.com";
const APP_NAME = "Series A Pitch Tool";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <div className="max-w-2xl mx-auto space-y-8 text-gray-700">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-400">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <p>
          Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before using{" "}
          {APP_NAME} operated by {COMPANY} (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
          &ldquo;our&rdquo;). By purchasing or using the Service, you agree to be bound by these
          Terms.
        </p>

        <Section title="1. The Service">
          <p>
            {APP_NAME} provides AI-assisted pitch deck and financial report preparation for
            early-stage companies raising a Series A round. The deliverables are advisory in nature
            and do not constitute financial, legal, or investment advice.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>
            You must be at least 18 years old and have the authority to enter into contracts on
            behalf of any company you represent. The Service is for business use only.
          </p>
        </Section>

        <Section title="3. Payment &amp; Fees">
          <p>
            All fees are stated at checkout and charged via Stripe. Prices are in USD and
            exclusive of applicable taxes. Payment is due at the time of purchase.
          </p>
          <p>
            <strong>Refunds.</strong> We offer a full refund if you request it within 48 hours of
            purchase and before you have submitted your intake form. Once the intake form is
            submitted and AI generation has begun, refunds are issued at our sole discretion.
          </p>
        </Section>

        <Section title="4. Your Data &amp; Content">
          <p>
            You retain all ownership rights to the data and content you provide (&ldquo;Your
            Content&rdquo;). By submitting Your Content, you grant us a limited, non-exclusive
            licence to process and use it solely to deliver the Service to you.
          </p>
          <p>
            You represent that Your Content is accurate to the best of your knowledge and that
            you have the right to share it with us.
          </p>
        </Section>

        <Section title="5. Deliverables &amp; Intellectual Property">
          <p>
            Upon full payment and delivery, you own the deliverables (pitch deck and report)
            produced for you. We retain no rights to the final files.
          </p>
          <p>
            The {APP_NAME} platform, software, branding, and any generic templates remain the
            exclusive property of {COMPANY}.
          </p>
        </Section>

        <Section title="6. Confidentiality">
          <p>
            We treat Your Content as confidential. We will not disclose your financial data or
            company information to third parties except as required to deliver the Service (e.g.,
            sending to our AI provider) or as required by law.
          </p>
        </Section>

        <Section title="7. Turnaround Time">
          <p>
            We target delivery within 5–7 business days of intake submission. This is an estimate,
            not a guarantee. Delays caused by incomplete or inaccurate intake data are not our
            responsibility.
          </p>
        </Section>

        <Section title="8. Disclaimers">
          <p>
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo;. WE MAKE NO WARRANTIES, EXPRESS OR
            IMPLIED, REGARDING THE ACCURACY, COMPLETENESS, OR FITNESS FOR A PARTICULAR PURPOSE
            OF THE DELIVERABLES. THE DELIVERABLES ARE NOT A GUARANTEE OF FUNDRAISING SUCCESS.
          </p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {COMPANY.toUpperCase()}&apos;S
            TOTAL LIABILITY ARISING OUT OF OR RELATING TO THE SERVICE SHALL NOT EXCEED THE FEES
            YOU PAID IN THE 12 MONTHS PRECEDING THE CLAIM. IN NO EVENT SHALL WE BE LIABLE FOR
            INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.
          </p>
        </Section>

        <Section title="10. Governing Law">
          <p>
            These Terms are governed by the laws of the State of Delaware, USA, without regard
            to conflict-of-law principles. Any disputes shall be resolved in the courts located
            in Delaware.
          </p>
        </Section>

        <Section title="11. Changes to Terms">
          <p>
            We may update these Terms at any time. We will provide at least 14 days&apos; notice
            by email for material changes. Continued use of the Service after changes take effect
            constitutes acceptance.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Questions about these Terms? Email{" "}
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
