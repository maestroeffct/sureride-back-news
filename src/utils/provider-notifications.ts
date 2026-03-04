import { mailer } from "./mailer";

type SubmissionSource = "ONBOARDING" | "PUBLIC_REQUEST";

type ProviderSubmissionPayload = {
  name: string;
  email: string;
  phone?: string | null;
  source: SubmissionSource;
};

type ProviderApprovalPayload = {
  name: string;
  email: string;
  temporaryPassword?: string;
};

function getAdminNotificationEmails() {
  const raw = process.env.ADMIN_NOTIFICATION_EMAILS;
  if (!raw) return [] as string[];

  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function sendMailSafe(options: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  } catch (error) {
    console.error("[ProviderNotifications] Failed to send email", {
      to: options.to,
      subject: options.subject,
      error,
    });
  }
}

export async function notifyProviderSubmission(payload: ProviderSubmissionPayload) {
  const adminEmails = getAdminNotificationEmails();

  if (adminEmails.length > 0) {
    await sendMailSafe({
      to: adminEmails,
      subject: `New Provider Submission: ${payload.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>New provider submission</h2>
          <p><b>Name:</b> ${payload.name}</p>
          <p><b>Email:</b> ${payload.email}</p>
          <p><b>Phone:</b> ${payload.phone ?? "-"}</p>
          <p><b>Source:</b> ${payload.source}</p>
          <p>Please review this provider in the admin dashboard.</p>
        </div>
      `,
    });
  }

  await sendMailSafe({
    to: payload.email,
    subject: "SureRide provider submission received",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Submission received</h2>
        <p>Hello ${payload.name},</p>
        <p>We received your provider submission and it is now under review.</p>
        <p>We will notify you once the review is complete.</p>
      </div>
    `,
  });
}

export async function notifyProviderApproved(payload: ProviderApprovalPayload) {
  if (payload.temporaryPassword) {
    await sendMailSafe({
      to: payload.email,
      subject: "SureRide provider account approved",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Your provider account is approved</h2>
          <p>Hello ${payload.name},</p>
          <p>Your provider account is now active.</p>
          <p>
            Temporary password: <b>${payload.temporaryPassword}</b>
          </p>
          <p>Please sign in and change your password immediately.</p>
        </div>
      `,
    });
    return;
  }

  await sendMailSafe({
    to: payload.email,
    subject: "SureRide provider account approved",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Your provider account is approved</h2>
        <p>Hello ${payload.name},</p>
        <p>Your provider account is now active. You can sign in with your existing credentials.</p>
      </div>
    `,
  });
}
