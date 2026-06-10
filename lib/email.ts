import { Resend } from "resend";

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set. Add it to .env.local or enable DEMO_MODE.");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendClientConfirmation(
  to: string,
  engagementId: string
): Promise<void> {
  const FROM = process.env.RESEND_FROM_ADDRESS!;
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
  void APP_URL;
  await getResend().emails.send({
    from: FROM,
    to,
    subject: "We received your pitch deck request",
    html: `
      <p>Thank you for your order. Your Series A pitch deck is in expert hands.</p>
      <p>Expect delivery within <strong>5–7 business days</strong>. We'll email you as soon as your deck is ready.</p>
      <p>Your reference number is <code>${engagementId}</code>.</p>
      <p>Questions? Reply to this email and we'll get back to you within one business day.</p>
    `,
  });
}

export async function sendAdminNotification(
  engagementId: string,
  clientName: string
): Promise<void> {
  const FROM = process.env.RESEND_FROM_ADDRESS!;
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
  const ADMIN_EMAILS = (process.env.ADMIN_NOTIFICATION_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (ADMIN_EMAILS.length === 0) {
    console.warn("sendAdminNotification: ADMIN_NOTIFICATION_EMAILS is not set");
    return;
  }

  await getResend().emails.send({
    from: FROM,
    to: ADMIN_EMAILS,
    subject: `New intake received — ${clientName}`,
    html: `
      <p>A client has completed their intake form and is ready for drafting.</p>
      <ul>
        <li><strong>Client:</strong> ${clientName}</li>
        <li><strong>Engagement ID:</strong> ${engagementId}</li>
      </ul>
      <p>
        <a href="${APP_URL}/admin/engagement/${engagementId}">
          Open in admin dashboard →
        </a>
      </p>
    `,
  });
}
