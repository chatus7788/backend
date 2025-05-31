// sendEmail.js
require("dotenv").config();
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendMail = async (email, activationUrl, emailText) => {
  // const activationUrl = `${process.env.FRONTEND_URL}/activate/${token}`;

  const msg = {
    to: email, // 🔸 change to recipient
    from: process.env.EMAIL_SENDER, // 🔸 must be verified sender
    subject: "Welcome to Our App!",
    text: "Thanks for signing up.",
    html: `<p>${emailText} by clicking <a href="${activationUrl}">here</a></p>`,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Email sent!");
  } catch (error) {
    console.error(
      "❌ Email send failed:",
      error.response?.body || error.message
    );
  }
};

module.exports = sendMail;
