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
      from: `"Check Mart" <${process.env.EMAIL_USER}>`,
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
      from: `"Check Mart" <${process.env.EMAIL_USER}>`,
      to: email,

      subject: `Check Mart Invoice - ${order.orderNumber}`,

      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">

          <h2>Check Mart</h2>

          <p>Dear ${order.shippingAddress.fullName},</p>

          <p>
            Thank you for shopping with Check Mart.
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
            Check Mart
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



const sendOrderStatusEmail = async (email, order, status) => {
  try {
    const statusMessages = {
      confirmed: "Your order has been confirmed.",
      processing: "Your order is now being prepared.",
      shipped: "Your order has been shipped.",
      delivered: "Your order has been delivered.",
      cancelled: "Your order has been cancelled.",
      pending: "Your order is pending.",
    };

    const mailOptions = {
      from: `"Check Mart" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Check Mart Order Update - ${order.orderNumber}`,
     
html: `
  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <h2>Check Mart</h2>

    <p>Dear ${order.shippingAddress.fullName},</p>

    <p>
      <strong>Your Order Number:</strong>
      ${order.orderNumber}
    </p>

    <p>
      Is <strong>${status.toUpperCase()}</strong>
    </p>

    <p>
      <strong>Your Order Amount Is:</strong>
      Rs. ${Number(order.grandTotal).toFixed(2)}
    </p>

    <p>
      Regards,<br>
      Check Mart
    </p>
  </div>
`,

    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("ORDER STATUS EMAIL ERROR:", error);
    throw error;
  }
};



module.exports = {
  sendOTPEmail,
   sendInvoiceEmail,
   sendOrderStatusEmail
};