import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
  } from "@react-email/components";
  import * as React from "react";
  
  interface PasswordRecoveryEmailProps {
    userName?: string;
    recoveryLink: string;
  }
  
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http:localhost:3000";
  
  export const PasswordRecoveryEmail = ({
    userName,
    recoveryLink,
  }: PasswordRecoveryEmailProps) => {
    const previewText = `Recover your password for Granton AI`;
  
    return (
      <Html>
        <Head />
        <Preview>{previewText}</Preview>
        <Tailwind>
          <Body className="bg-white my-auto mx-auto font-sans px-2">
            <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Img
                  src={`https://res.cloudinary.com/dehmpfffb/image/upload/v1749057626/Granton_Logo_kulnab.png`}
                  width="48"
                  height="48"
                  alt="GrantonAI Logo"
                  className="my-5 mx-auto"
                />
              {/* <Section className="mt-[32px]">
               
                <div className="flex items-center gap-2">
                
                  <div className="rounded-sm bg-[#6127FF] flex items-center justify-center size-7 mr-1">
                    <div className="size-4 rounded-full bg-white dark:bg-black" />
                  </div>
                  <div
                    className="text-base font-semibold whitespace-nowrap "
  
                  >
                    GNotes
                  </div>
                </div>
              </Section> */}
              {/* <Section className="mt-[32px] flex flex-row justify-center items-center gap-2">
                <Text className="bg-[#6127FF] text-white rounded-sm w-6 h-6 flex items-center justify-center mr-1">
                  G
                </Text>
                <Text className="text-base font-semibold whitespace-nowrap">
                  GNotes
                </Text>
              </Section> */}
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[26px] mx-0">
                Hello, <strong>{userName}</strong>
              </Heading>
              <Text className="text-black/80 text-[14px] leading-[24px]">
                We received a request to reset your password for your <strong>Granton AI</strong> account. Click the button below to reset your password.
              </Text>
              <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                  className="bg-black rounded text-white text-[14px] font-semibold no-underline text-center px-5 py-3"
                  href={recoveryLink}
                >
                  Reset your password
                </Button>
              </Section>
              <Text className="text-black text-[14px] leading-[24px]">
                Or copy and paste this URL into your browser:
                <Link
                  href={recoveryLink}
                  className="text-blue-500 no-underline"
                >
                  {recoveryLink}
                </Link>
              </Text>
              <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
              <Text className="text-black text-[12px] leading-[24px]">
                If you did not request this password reset, you can safely ignore this email. For any concerns, feel free to contact our support team.
              </Text>
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  };
  
  export default PasswordRecoveryEmail;
  
  PasswordRecoveryEmail.PreviewProps = {
    userName: "John Doe",
    recoveryLink: "https://example.com/reset-password",
  } as PasswordRecoveryEmailProps;
  