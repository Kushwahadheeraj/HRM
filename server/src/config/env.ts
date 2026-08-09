import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/traxale-hrm',
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-key-change-in-production',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN || '',
  SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET || '',
  SLACK_CHANNEL: process.env.SLACK_CHANNEL || '#general',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: process.env.SMTP_PORT || '',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  LOGIN_URL: process.env.LOGIN_URL || 'http://localhost:5173/login',
  COMPANY_NAME: process.env.COMPANY_NAME || 'Traxale HRMS',
  COMPANY_EMAIL: process.env.COMPANY_EMAIL || 'support@traxale.com',
  COMPANY_WEBSITE: process.env.COMPANY_WEBSITE || 'https://traxale.com',
  COMPANY_LOGO_URL: process.env.COMPANY_LOGO_URL || 'https://traxale.com/logo.png',
  EMAIL_RETRY_ATTEMPTS: Number(process.env.EMAIL_RETRY_ATTEMPTS) || 3,
  EMAIL_RETRY_DELAY_MS: Number(process.env.EMAIL_RETRY_DELAY_MS) || 2000,
  BREVO_API_KEY: process.env.BREVO_API_KEY || '',
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || '',
  BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME || 'Traxale HRM',
  FRONTEND_URL: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
};
