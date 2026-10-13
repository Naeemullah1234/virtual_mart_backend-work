const nodemailer = require("nodemailer");



const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"Virtual Mart" <${process.env.EMAIL_USER}>`,
      to: email,

      subject: "CHECK MART Email Verification OTP",

      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Check Mart Email Verification</h2>

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

  } catch (error) {
    console.log("========== EMAIL ERROR ==========");
    console.log(error);
    console.log("=================================");

    throw error;
  }
};

  const sendInvoiceEmail = async (email, order, invoiceFilePath) => {
  try {
    const mailOptions = {
      from: `"Virtual Mart" <${process.env.EMAIL_USER}>`,
      to: email,

      subject: `Virtual Mart Invoice - ${order.orderNumber}`,

      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">

          <h2>Virtual Mart</h2>

          <p>Dear ${order.shippingAddress.fullName},</p>

          <p>
            Thank you for shopping with Virtual Mart.
          </p>

          <p>
            Your order has been placed successfully.
          </p>

          <p>
            <strong>Order Number:</strong>
            ${order.orderNumber}
          </p>

          <p>
            <strong>Grand Total:</strong>
            Rs. ${order.grandTotal.toFixed(2)}
          </p>

          <p>
            Your invoice PDF is attached with this email.
          </p>

          <p>
            Regards,<br>
            Virtual Mart
          </p>

        </div>
      `,

      attachments: [
        {
          filename: `invoice-${order.orderNumber}.pdf`,
          path: invoiceFilePath,
          contentType: "application/pdf",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

  } catch (error) {
    console.log("========== INVOICE EMAIL ERROR ==========");
    console.log(error);
    console.log("=========================================");

    throw error;
  }
}; 


module.exports = {
  sendOTPEmail,
   sendInvoiceEmail,
};