import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
} from "@react-email/components";
import type { InvitationEmailProps } from "./types";

export function InvitationFormal({
  electionTitle,
  electionDescription,
  ownerName,
  voteUrl,
  customMessage,
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You are invited to vote in {electionTitle}</Preview>
      <Body style={{ backgroundColor: "#f4f5f7", fontFamily: "Georgia, 'Times New Roman', serif", margin: 0, padding: "24px 0" }}>
        <Container style={{ backgroundColor: "#ffffff", maxWidth: "560px", margin: "0 auto", border: "1px solid #e2e4e8" }}>
          <Section style={{ backgroundColor: "#1f2a44", padding: "28px 40px" }}>
            <Heading as="h1" style={{ color: "#ffffff", fontSize: "20px", fontWeight: 600, margin: 0, letterSpacing: "0.5px" }}>
              Official Voting Invitation
            </Heading>
          </Section>
          <Section style={{ padding: "32px 40px" }}>
            <Text style={{ fontSize: "15px", color: "#1f2a44", lineHeight: "24px", margin: "0 0 16px" }}>
              Dear Voter,
            </Text>
            <Text style={{ fontSize: "15px", color: "#1f2a44", lineHeight: "24px", margin: "0 0 16px" }}>
              You have been formally invited by {ownerName} to participate in the
              following election:
            </Text>
            <Heading as="h2" style={{ fontSize: "18px", color: "#1f2a44", margin: "0 0 8px" }}>
              {electionTitle}
            </Heading>
            {electionDescription ? (
              <Text style={{ fontSize: "14px", color: "#5a6478", lineHeight: "22px", margin: "0 0 16px" }}>
                {electionDescription}
              </Text>
            ) : null}
            {customMessage ? (
              <Text style={{ fontSize: "15px", color: "#1f2a44", lineHeight: "24px", margin: "0 0 16px" }}>
                {customMessage}
              </Text>
            ) : null}
            <Section style={{ textAlign: "center", padding: "16px 0 8px" }}>
              <Button
                href={voteUrl}
                style={{
                  backgroundColor: "#1f2a44",
                  color: "#ffffff",
                  fontSize: "15px",
                  padding: "12px 32px",
                  textDecoration: "none",
                }}
              >
                Cast Your Vote
              </Button>
            </Section>
            <Hr style={{ borderColor: "#e2e4e8", margin: "24px 0 16px" }} />
            <Text style={{ fontSize: "12px", color: "#8a91a3", lineHeight: "18px", margin: 0 }}>
              This invitation is personal and should not be forwarded. If the
              button does not work, copy this link into your browser: {voteUrl}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
