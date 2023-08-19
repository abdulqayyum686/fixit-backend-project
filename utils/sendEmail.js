// const { SMTPClient, Message } = require("emailjs");
const config = require("config");
const nodemailer = require("nodemailer");

function sendEmail(to, subject, text, verifyToken, type) {
  console.log(to, subject, text, verifyToken, "afzal");
  const transporter = nodemailer.createTransport({
    // host: "smtp.gmail.com",
    // port: 465,
    // secure: true,
    // auth: {
    //   user: "qayyuma686@gmail.com",
    //   pass: "ziyfvpktqpmamnru",
    // },
    host: "smtp-relay.sendinblue.com",
    port: 587,
    secure: false,
    auth: {
      user: "sp17bsed@gmail.com",
      pass: "9wISqdmrY0MLCFJT",
    },
  });
  const message = {
    // from: "qayyuma686@gmail.com",
    from: "Customer@flixit.co.Uk", // sender address
    to: to,
    subject: subject,
    html: `<html><div style=\"font-family: Arial, sans-serif; color: #333333; background-color: #f5f5f5; padding: 30px;\">
    <div style=\"max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);\">
      <div style=\"padding: 30px;\">
        <img src=\"https://res.cloudinary.com/comsat-lahore/image/upload/v1685867672/Flixit_axjwdg.png" alt="Logo" style="display: block; background-color: black; margin: 0 auto; padding: 10px ; width: 200px; border-radius: 15px;\">
        <h2 style=\"text-align: center; margin-top: 30px; margin-bottom: 0;\">${
          text == "forgot" ? "Reset Your Password" : "Verify Your Email"
        }</h2>
        <p style=\"text-align: center; font-size: 16px;\">${
          text == "forgot"
            ? "Please click the button below to reset your password:"
            : "Please verify your email address to complete your registration:"
        }</p>

        ${
          text == "forgot"
            ? `<div style=\"text-align: center;\">
              <a href="http://18.170.102.108/${type}/resetpassword/${verifyToken}" 
              style=\"display: inline-block; padding: 10px 20px; background-color: #1f88be; color: white; font-size: 16px; text-decoration: none; border-radius: 5px; margin-top: 30px;\">
              Reset Password
              </a>
              </div>`
            : `<div style=\"text-align: center;\">
              <a href="http://13.42.57.230/api/${type}/verify/${verifyToken}" style=\"display: inline-block; padding: 10px 20px; background-color: #1f88be; color: white; font-size: 16px; text-decoration: none; border-radius: 5px; margin-top: 30px;\">
                Verify Email
              </a>
              </div>`
        }



      </div>
      <div style=\"background-color: #1f88be; color: white; text-align: center; padding: 10px; font-size: 14px;\">
        <p style=\"margin: 0;\">If you did not sign up for this service, please disregard this email.</p>
      </div>
    </div>
  </div></html>`,
  };

  transporter.sendMail(message, async function (error, info) {
    if (error) {
      console.log(error);
      throw new Error("Mail not sent");
    } else {
      console.log("Email sent acccepted: =>" + info.response);
      // res.status(200).json({
      //     message: "OTP has been sent to your mail please check your email",
      // });
      return true;
    }
  });
}

module.exports = sendEmail;
