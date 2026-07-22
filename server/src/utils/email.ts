import nodemailer from 'nodemailer';
import { env } from '../config/env';

// Check if email credentials are available
const areEmailCredentialsSet = !!env.EMAIL_USER && !!env.EMAIL_PASS;

// Create a transporter only if credentials are set
let transporter: nodemailer.Transporter | null = null;
if (areEmailCredentialsSet) {
  transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other services like Outlook, Yahoo, or your own SMTP server
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });
  console.log('✅ Email transporter configured');
} else {
  console.log('⚠️  Email credentials not found. Welcome emails will not be sent.');
}

export const sendWelcomeEmail = async (
  to: string,
  name: string,
  password: string,
  role: string,
  hrName: string,
  hrEmail: string
) => {
  try {
    if (!areEmailCredentialsSet || !transporter) {
      console.log('⚠️  Skipping welcome email: Email credentials not configured');
      return false;
    }
    
    const mailOptions = {
      from: `${hrName} <${env.EMAIL_USER}>`, // Show HR's name with company email
      replyTo: hrEmail, // Replies go directly to HR
      to,
      subject: 'Your Traxale HRM Account Details',
      text: `Hello ${name},

Your ${role} account has been created in Traxale HRM by ${hrName} (${hrEmail})!

Your login details:
Email: ${to}
Password: ${password}

You can now log in to your account. If you have any questions, please reply to this email.

Thanks,
Traxale HRM Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};
