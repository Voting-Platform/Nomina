import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

let cached: Transporter | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function getTransport(): Transporter {
  if (cached) return cached;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      "Email is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local"
    );
  }

  cached = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    pool: true,
    maxConnections: 2,
    maxMessages: 50,
    auth: { user, pass },
  });
  return cached;
}

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendMail(input: SendMailInput): Promise<void> {
  const transport = getTransport();
  await transport.sendMail({
    from: `"Nomina Voting" <${process.env.GMAIL_USER}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}
