import "server-only";
import { render } from "@react-email/render";
import { InvitationFormal } from "./templates/InvitationFormal";
import { InvitationCasual } from "./templates/InvitationCasual";
import { InvitationMinimal } from "./templates/InvitationMinimal";
import { OtpEmail } from "./templates/OtpEmail";
import type { InvitationEmailProps } from "./templates/types";
import type { EmailTemplatePreset } from "@/types";

const PRESET_COMPONENTS = {
  formal: InvitationFormal,
  casual: InvitationCasual,
  minimal: InvitationMinimal,
} as const;

const DEFAULT_SUBJECTS: Record<EmailTemplatePreset, (title: string) => string> = {
  formal: (title) => `Invitation to vote: ${title}`,
  casual: (title) => `🗳️ You're invited to vote in ${title}!`,
  minimal: (title) => `Vote: ${title}`,
};

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export async function renderInvitationEmail(
  preset: EmailTemplatePreset,
  data: InvitationEmailProps & { customSubject?: string }
): Promise<RenderedEmail> {
  const Component = PRESET_COMPONENTS[preset];
  const element = Component(data);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  const subject =
    data.customSubject?.trim() || DEFAULT_SUBJECTS[preset](data.electionTitle);
  return { subject, html, text };
}

export const OTP_EXPIRES_MINUTES = 10;

export async function renderOtpEmail(data: {
  electionTitle: string;
  otp: string;
}): Promise<RenderedEmail> {
  const element = OtpEmail({ ...data, expiresMinutes: OTP_EXPIRES_MINUTES });
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return {
    subject: `Your voting code for ${data.electionTitle}`,
    html,
    text,
  };
}
