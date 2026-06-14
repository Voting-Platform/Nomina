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

export function InvitationMinimal({
  electionTitle,
  electionDescription,
  ownerName,
  voteUrl,
  customMessage,
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Vote in {electionTitle}</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "Helvetica, Arial, sans-serif", margin: 0, padding: "40px 0" }}>
        <Container style={{ maxWidth: "480px", margin: "0 auto", padding: "0 24px" }}>
          <Heading as="h1" style={{ fontSize: "18px", color: "#111111", fontWeight: 600, margin: "0 0 24px" }}>
            {electionTitle}
          </Heading>
          {electionDescription ? (
            <Text style={{ fontSize: "14px", color: "#555555", lineHeight: "22px", margin: "0 0 16px" }}>
              {electionDescription}
            </Text>
          ) : null}
          <Text style={{ fontSize: "14px", color: "#111111", lineHeight: "22px", margin: "0 0 16px" }}>
            {ownerName} has invited you to vote.
          </Text>
          {customMessage ? (
            <Text style={{ fontSize: "14px", color: "#111111", lineHeight: "22px", margin: "0 0 16px" }}>
              {customMessage}
            </Text>
          ) : null}
          <Section style={{ padding: "8px 0 24px" }}>
            <Button
              href={voteUrl}
              style={{
                backgroundColor: "#111111",
                color: "#ffffff",
                fontSize: "14px",
                padding: "10px 24px",
                borderRadius: "6px",
                textDecoration: "none",
              }}
            >
              Vote
            </Button>
          </Section>
          <Hr style={{ borderColor: "#eeeeee", margin: "0 0 16px" }} />
          <Text style={{ fontSize: "12px", color: "#999999", lineHeight: "18px", margin: 0 }}>
            Personal link — do not forward. Or copy: {voteUrl}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
