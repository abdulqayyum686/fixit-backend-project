// const { SMTPClient, Message } = require("emailjs");
const config = require("config");
const nodemailer = require("nodemailer");
function sendMessageEmail(to) {
  console.log(to, "ali raza====");
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "qayyuma686@gmail.com",
      pass: "ziyfvpktqpmamnru",
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
  const message = {
    from: "qayyuma686@gmail.com",
    to: to.email,
    subject: "Got new message",
    html: `<html><div style=\"font-family: Arial, sans-serif; color: #333333; background-color: #f5f5f5; padding: 30px;\">
    <div style=\"max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);\">
      <div style=\"padding: 30px;\">
        <p style=\"text-align: center; font-size: 16px;\">
        You Got New Message from  ${to.name} please check your chat section 
        
       </p>
       <a href="/http://18.170.102.108/chat" >Link Button</a>
        
     
    </div>
  </div></html>`,
  };

  transporter.sendMail(message, async function (error, info) {
    if (error) {
      console.log(error);
      throw new Error("Mail not sent", error);
    } else {
      console.log("Email sent acccepted: =>" + info.response);
      // res.status(200).json({
      //     message: "OTP has been sent to your mail please check your email",
      // });
      return true;
    }
  });
}

module.exports = sendMessageEmail;
