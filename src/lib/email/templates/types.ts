export interface InvitationEmailProps {
  electionTitle: string;
  electionDescription: string;
  ownerName: string;
  /** Personalized voting link (includes the voter token for protected elections). */
  voteUrl: string;
  /** Optional creator-written paragraph shown above the button. */
  customMessage: string;
}

export interface OtpEmailProps {
  electionTitle: string;
  otp: string;
  expiresMinutes: number;
}
