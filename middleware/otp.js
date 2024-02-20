const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");

const sendmail = (email) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const otp = otpGenerator.generate(5, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    var timestamp = new Date().getTime();
    var otpTimestamp1 = Math.floor(timestamp / 1000);
    console.log(
      "OTP generated is " +
        otp +
        " from otp middleware" +
        " at " +
        otpTimestamp1
    );
    //console.log("timestamp when OTP is created :" + otpTimestamp1);
    //req.session.otpExpiry = otpTimestamp1;

    var mailOptions = {
      from: "getantiques <getantiques@gmail.com>",
      to: email,
      subject: "E-Mail Verification",
      text:
        "Hi user, Welcome to getantiques. Please verify with the OTP:" + otp +
        " to proceed further.",
    };

    transporter.sendMail(mailOptions);
    console.log("E-mail sent successfully");

    // var timestamp = new Date().getTime();
    // var otpTimestamp1 = Math.floor(timestamp / 1000);
    return [otp, otpTimestamp1];

    //    return otp;
  } catch (err) {
    console.log("error in sending mail:", err);
  }
};

module.exports = { sendmail };
