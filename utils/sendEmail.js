const nodemailer = require("nodemailer");



const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS,},});

const sendOTPEmail = async (email, otp) => {

  const mailOptions = { from: `"Virtual Mart" <${process.env.EMAIL_USER}>`, to: email,

    subject: "Admin Email Verification OTP",

    html: `
      <div style="font-family: Arial, sans-serif;">

        <h2>Admin Email Verification</h2>

        <p>Your verification OTP is:</p>

        <h1 style="letter-spacing: 5px;">
          ${otp}
        </h1>

        <p>
          This OTP will expire in
          <strong>10 minutes</strong>.
        </p>

         <p>
          Please Don't Share This OTP with anyone else.
        </p>

        <p>
          If you did not request this OTP,
          please ignore this email.
        </p>

      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};


module.exports = {
  sendOTPEmail,
};