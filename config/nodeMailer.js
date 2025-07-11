import nodeMailer from 'nodemailer';
import 'dotenv/config';

const transporter = nodeMailer.createTransport({
  
    // host: "smtp-relay.brevo.com",
    // port: 587,
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS 
    },
     logger: true,
    debug: true

});

export default transporter;