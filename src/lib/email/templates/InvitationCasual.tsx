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
} from "@react-email/components";
import type { InvitationEmailProps } from "./types";

export function InvitationCasual({
  electionTitle,
  electionDescription,
  ownerName,
  voteUrl,
  customMessage,
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{ownerName} wants your vote in {electionTitle} 🗳️</Preview>
      <Body style={{ backgroundColor: "#f0eefc", fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif", margin: 0, padding: "24px 0" }}>
        <Container style={{ backgroundColor: "#ffffff", maxWidth: "560px", margin: "0 auto", borderRadius: "16px", overflow: "hidden" }}>
          <Section style={{ background: "#6C5CE7", padding: "36px 40px", textAlign: "center" }}>
            <Text style={{ fontSize: "40px", margin: "0 0 8px" }}>🗳️</Text>
            <Heading as="h1" style={{ color: "#ffffff", fontSize: "24px", fontWeight: 700, margin: 0 }}>
              You&apos;re invited to vote!
            </Heading>
          </Section>
          <Section style={{ padding: "32px 40px" }}>
            <Text style={{ fontSize: "15px", color: "#2d3142", lineHeight: "24px", margin: "0 0 16px" }}>
              Hey there! 👋 {ownerName} invited you to have your say in:
            </Text>
            <Heading as="h2" style={{ fontSize: "20px", color: "#6C5CE7", margin: "0 0 8px" }}>
              {electionTitle}
            </Heading>
            {electionDescription ? (
              <Text style={{ fontSize: "14px", color: "#6b7280", lineHeight: "22px", margin: "0 0 16px" }}>
                {electionDescription}
              </Text>
            ) : null}
            {customMessage ? (
              <Text style={{ fontSize: "15px", color: "#2d3142", lineHeight: "24px", margin: "0 0 16px" }}>
                {customMessage}
              </Text>
            ) : null}
            <Section style={{ textAlign: "center", padding: "16px 0 8px" }}>
              <Button
                href={voteUrl}
                style={{
                  backgroundColor: "#6C5CE7",
                  color: "#ffffff",
                  fontSize: "16px",
                  fontWeight: 600,
                  padding: "14px 36px",
                  borderRadius: "12px",
                  textDecoration: "none",
                }}
              >
                Vote now →
              </Button>
            </Section>
            <Text style={{ fontSize: "12px", color: "#9ca3af", lineHeight: "18px", margin: "24px 0 0", textAlign: "center" }}>
              This link is just for you — please don&apos;t share it.
              <br />
              Button not working? Paste this into your browser: {voteUrl}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
