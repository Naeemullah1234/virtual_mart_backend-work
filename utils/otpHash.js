const crypto = require("crypto");

const hashOTP = (otp) => {
  return crypto
    .createHmac("sha256", process.env.OTP_SECRET)
    .update(String(otp))
    .digest("hex");
};

module.exports = { hashOTP };