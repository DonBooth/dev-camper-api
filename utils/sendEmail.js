// using nodemailer
// and using MailTrap 


// copied  and modified from nodemailer website.

const nodemailer = require("nodemailer");

// async..await is not allowed in global scope, must use a wrapper
const sendEmail = async (options) => {

    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        // secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    // send mail with defined transport object
    let message = {
        from: `process.env.FROM_EMAIL <process.env.FROM_EMAIL>`, // sender address
        to: options.email, // process.env.FROM_NAME, // list of receivers
        subject: options.subject, // Subject line
        text: options.message, // plain text body
        html: options.html // html body
    }

    const info = await transporter.sendMail(message)

    console.log("Message sent: %s", info.messageId)

}

module.exports = sendEmail