const emailQueue = require("../queues/emailQueue");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const inlineBase64 = require("nodemailer-plugin-inline-base64");

dotenv.config();

// Process email jobs
emailQueue.process(async (job) => {
  const { type, data } = job.data;

  console.log(`📧 Processing email job ${job.id} - Type: ${type}`);

  try {
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_ACCOUNT,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    transporter.use("compile", inlineBase64({ cidPrefix: "somePrefix_" }));

    if (type === "CREATE_ORDER") {
      const { email, orderItems } = data;
      
      let listItem = "";
      const attachImage = [];
      
      orderItems.forEach((order) => {
        listItem += `<div>
        <div>
          Bạn đã đặt sản phẩm <b>${order.name}</b> với số lượng: <b>${order.amount}</b> và giá là: <b>${order.price} VND</b></div>
          <div>Bên dưới là hình ảnh của sản phẩm</div>
        </div>`;
        attachImage.push({ path: order.image });
      });

      await transporter.sendMail({
        from: process.env.MAIL_ACCOUNT,
        to: email,
        subject: "Bạn đã đặt hàng tại shop LẬP trình thật dễ",
        text: "Hello world?",
        html: `<div><b>Bạn đã đặt hàng thành công tại shop Lập trình thật dễ</b></div> ${listItem}`,
        attachments: attachImage,
      });

      console.log(`✅ Order email sent to ${email}`);
    } else if (type === "FORGOT_PASSWORD") {
      const { email, resetLink } = data;

      await transporter.sendMail({
        from: process.env.MAIL_ACCOUNT,
        to: email,
        subject: "Để biết mật khẩu hiện tại của bạn, Vui lòng click vào link phía dưới.",
        text: `Click vào đường link sau để đặt lại mật khẩu: ${resetLink}`,
      });

      console.log(`✅ Reset password email sent to ${email}`);
    }

    return { success: true, type };
  } catch (error) {
    console.error(`❌ Email job ${job.id} error:`, error.message);
    
    // Provide helpful hints for common email errors
    if (error.message.includes('535') || error.message.includes('Username and Password not accepted')) {
      console.error(`💡 Tip: Gmail requires App Passwords for SMTP authentication.`);
      console.error(`   1. Enable 2-Step Verification on your Google Account`);
      console.error(`   2. Generate an App Password at: https://myaccount.google.com/apppasswords`);
      console.error(`   3. Use the 16-character App Password in MAIL_PASSWORD env variable`);
    }
    
    throw error; // Throw để Bull retry
  }
});

console.log("🚀 Email Worker started");

module.exports = emailQueue;
