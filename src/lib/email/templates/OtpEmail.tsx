import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
} from "@react-email/components";
import type { OtpEmailProps } from "./types";

export function OtpEmail({ electionTitle, otp, expiresMinutes }: OtpEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your voting code: {otp}</Preview>
      <Body style={{ backgroundColor: "#f4f5f7", fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif", margin: 0, padding: "24px 0" }}>
        <Container style={{ backgroundColor: "#ffffff", maxWidth: "480px", margin: "0 auto", borderRadius: "12px", padding: "32px 40px" }}>
          <Heading as="h1" style={{ fontSize: "18px", color: "#2d3142", margin: "0 0 8px" }}>
            Your verification code
          </Heading>
          <Text style={{ fontSize: "14px", color: "#6b7280", lineHeight: "22px", margin: "0 0 24px" }}>
            Use this code to access the election &quot;{electionTitle}&quot;:
          </Text>
          <Section style={{ backgroundColor: "#f0eefc", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
            <Text style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "8px", color: "#6C5CE7", margin: 0 }}>
              {otp}
            </Text>
          </Section>
          <Text style={{ fontSize: "13px", color: "#6b7280", lineHeight: "20px", margin: "24px 0 0" }}>
            This code expires in {expiresMinutes} minutes. If you didn&apos;t
            request it, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
