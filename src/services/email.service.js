import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email, username, token) => {

  console.log("========== EMAIL DEBUG ==========");
  console.log("EMAIL SERVICE CALLED");
  console.log("Email:", email);
  console.log("API KEY EXISTS:", !!process.env.RESEND_API_KEY);
  console.log("=================================");


  console.log("EMAIL SERVICE CALLED");
  console.log("Sending to:", email);
  console.log("API key loaded:", !!process.env.RESEND_API_KEY);
  console.log("Sending verification email to:", email);
  console.log(
    "RESEND_API_KEY loaded:",
    !!process.env.RESEND_API_KEY
  );

  const verificationUrl =
    `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: "YouTube Clone <onboarding@resend.dev>",
    to: [email],
    subject: "Verify your YouTube Clone email",
    html: `
      <h2>Welcome, ${username}!</h2>

      <p>Thanks for creating your account.</p>

      <p>Please verify your email address:</p>

      <p>
        <a href="${verificationUrl}">
          Verify Email
        </a>
      </p>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(error.message);
  }

  console.log("Resend email response:", data);

  return data;
};