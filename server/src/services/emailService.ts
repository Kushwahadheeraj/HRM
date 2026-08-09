import nodemailer from 'nodemailer';
import { env } from '../config/env';
import EmailLog from '../models/EmailLog.model';
import mongoose from 'mongoose';
import {
  generateEmployeeWelcomeTemplate,
  generateEmployeeWelcomeSubject,
  EmployeeWelcomeData,
  generateBaseEmailLayout,
} from '../templates/employeeWelcomeTemplate';
import { isValidEmail } from '../utils/password';

export interface SendEmailResult {
  success: boolean;
  message: string;
  retryCount?: number;
  errorMessage?: string;
}

export interface EmailSendOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: any;
    path?: string;
    contentType?: string;
  }>;
  employeeId?: mongoose.Types.ObjectId | string;
  organizationId?: mongoose.Types.ObjectId | string;
  emailType?: string;
}

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const getTransporter = (): nodemailer.Transporter | null => {
  const smtpHost = env.SMTP_HOST || (env.EMAIL_USER ? 'smtp.gmail.com' : '');
  const smtpPort = Number(env.SMTP_PORT || (env.SMTP_HOST ? 587 : (env.EMAIL_USER ? 587 : 0)));
  const smtpUser = env.SMTP_USER || env.EMAIL_USER || '';
  const smtpPass = env.SMTP_PASS || env.EMAIL_PASS || '';

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('⚠️  [EmailService] SMTP credentials incomplete.', {
      hasHost: !!smtpHost,
      hasUser: !!smtpUser,
      hasPass: !!smtpPass,
    });
    return null;
  }

  console.log('📧 [EmailService] Initializing SMTP transporter:', {
    host: smtpHost,
    port: smtpPort,
    user: smtpUser,
  });

  const isSecure = smtpPort === 465;
  const requireTLS = smtpPort === 587;

  const authObj: any = {
    host: smtpHost,
    port: smtpPort,
    secure: isSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  };

  if (requireTLS) {
    authObj.requireTLS = true;
  }

  try {
    const transporter = nodemailer.createTransport(authObj);
    return transporter;
  } catch (error) {
    console.error('❌ [EmailService] Failed to create email transporter:', error);
    return null;
  }
};

export const verifySmtpConnection = async (): Promise<boolean> => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log('⚠️  [EmailService] SMTP credentials not configured');
      return false;
    }
    await transporter.verify();
    console.log('✅ [EmailService] SMTP connection verified successfully');
    return true;
  } catch (error: any) {
    console.error('❌ [EmailService] SMTP connection verification FAILED:', error?.message || error);
    console.error('❌ [EmailService] Full error:', JSON.stringify(error, null, 2));
    return false;
  }
};

const logEmailDelivery = async (
  employeeId: mongoose.Types.ObjectId | string | undefined,
  email: string,
  subject: string,
  status: 'success' | 'failed',
  retryCount: number,
  errorMessage?: string,
  organizationId?: mongoose.Types.ObjectId | string,
  emailType: string = 'general'
): Promise<void> => {
  try {
    if (!employeeId) {
      return;
    }

    const logEntry = new EmailLog({
      employeeId: employeeId instanceof mongoose.Types.ObjectId
        ? employeeId
        : new mongoose.Types.ObjectId(employeeId),
      employeeEmail: email,
      subject,
      status,
      retryCount,
      errorMessage: errorMessage || undefined,
      emailType,
      organizationId: organizationId
        ? (organizationId instanceof mongoose.Types.ObjectId
            ? organizationId
            : new mongoose.Types.ObjectId(organizationId))
        : undefined,
    });

    await logEntry.save();
  } catch (logError) {
    console.error('❌ Failed to log email delivery:', logError);
  }
};

export const sendEmailWithRetry = async (
  options: EmailSendOptions
): Promise<SendEmailResult> => {
  const {
    to,
    subject,
    htmlContent,
    textContent,
    replyTo,
    cc,
    bcc,
    attachments,
    employeeId,
    organizationId,
    emailType = 'general',
  } = options;

  const maxAttempts = env.EMAIL_RETRY_ATTEMPTS;
  const retryDelay = env.EMAIL_RETRY_DELAY_MS;

  if (!isValidEmail(to)) {
    const errorMsg = `Invalid email address: ${to}`;
    console.error('❌', errorMsg);
    await logEmailDelivery(employeeId, to, subject, 'failed', 0, errorMsg, organizationId, emailType);
    return {
      success: false,
      message: errorMsg,
      retryCount: 0,
      errorMessage: errorMsg,
    };
  }

  const transporter = getTransporter();
  if (!transporter) {
    const errorMsg = 'Email transporter not configured. SMTP credentials are missing.';
    console.warn('⚠️ ', errorMsg);
    await logEmailDelivery(employeeId, to, subject, 'failed', 0, errorMsg, organizationId, emailType);
    return {
      success: false,
      message: errorMsg,
      retryCount: 0,
      errorMessage: errorMsg,
    };
  }

  const rawFromAddress = env.SMTP_FROM || env.EMAIL_USER || `${env.COMPANY_NAME} <${env.COMPANY_EMAIL}>`;
  const fromAddress = rawFromAddress.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  console.log('📧 [EmailService] Sending email:', {
    to,
    from: fromAddress,
    subject,
    replyTo: replyTo || env.COMPANY_EMAIL,
  });

  const mailOptions: nodemailer.SendMailOptions = {
    from: fromAddress,
    to,
    subject,
    html: htmlContent,
    replyTo: replyTo || env.COMPANY_EMAIL,
  };

  if (textContent) {
    mailOptions.text = textContent;
  }

  if (cc) {
    mailOptions.cc = cc;
  }

  if (bcc) {
    mailOptions.bcc = bcc;
  }

  if (attachments && attachments.length > 0) {
    mailOptions.attachments = attachments;
  }

  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`📤 [EmailService] Attempt ${attempt}/${maxAttempts} - sending email to ${to}...`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ [EmailService] Email sent (attempt ${attempt}/${maxAttempts}):`, {
        to,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      });

      await logEmailDelivery(
        employeeId,
        to,
        subject,
        'success',
        attempt - 1,
        undefined,
        organizationId,
        emailType
      );

      return {
        success: true,
        message: `Email sent successfully to ${to}`,
        retryCount: attempt - 1,
      };
    } catch (error: any) {
      lastError = error;
      console.error(`❌ [EmailService] Failed attempt ${attempt}/${maxAttempts} to ${to}:`, {
        message: error?.message,
        code: error?.code,
        command: error?.command,
        response: error?.response ? String(error.response).slice(0, 500) : undefined,
      });

      if (attempt < maxAttempts) {
        console.log(`⏳ [EmailService] Retrying in ${retryDelay}ms...`);
        await sleep(retryDelay);
      }
    }
  }

  const errorMsg = lastError?.message || `Failed to send email after ${maxAttempts} attempts`;
  const errorDetails = lastError?.code
    ? ` [Code: ${lastError.code}]`
    : '';
  console.error(`❌ [EmailService] PERMANENT FAIL after ${maxAttempts} attempts to ${to}: ${errorMsg}${errorDetails}`);
  if (lastError?.response) {
    console.error(`❌ [EmailService] Server response:`, String(lastError.response).slice(0, 800));
  }

  await logEmailDelivery(
    employeeId,
    to,
    subject,
    'failed',
    maxAttempts,
    errorMsg,
    organizationId,
    emailType
  );

  return {
    success: false,
    message: `Failed to send email after ${maxAttempts} attempts`,
    retryCount: maxAttempts,
    errorMessage: errorMsg,
  };
};

export const sendEmployeeWelcomeEmail = async (
  employeeData: EmployeeWelcomeData & {
    employeeId?: mongoose.Types.ObjectId | string;
    organizationId?: mongoose.Types.ObjectId | string;
    hrName?: string;
    hrEmail?: string;
  }
): Promise<SendEmailResult> => {
  try {
    const subject = generateEmployeeWelcomeSubject();
    const htmlContent = generateEmployeeWelcomeTemplate(employeeData);

    const textContent = `
Welcome to ${env.COMPANY_NAME}, ${employeeData.employeeName}!

Your account has been created successfully.

EMPLOYEE INFORMATION:
- Employee Name: ${employeeData.employeeName}
- Employee ID: ${employeeData.employeeId}
- Email Address: ${employeeData.email}
- Department: ${employeeData.department || 'N/A'}
- Designation: ${employeeData.designation || 'N/A'}
- Role: ${employeeData.role}
- Manager: ${employeeData.managerName || 'N/A'}
- Joining Date: ${employeeData.joiningDate}
- Employment Type: ${employeeData.employmentType || 'Full-Time'}
- Office Location: ${employeeData.officeLocation || 'N/A'}
- Phone: ${employeeData.phoneNumber || 'N/A'}
- Shift: ${employeeData.shift || 'General'}
- Working Hours: ${employeeData.workingHours || '9:00 AM - 6:00 PM'}
- Status: ${employeeData.employeeStatus || 'Active'}

LOGIN CREDENTIALS:
- Login URL: ${employeeData.loginUrl || env.LOGIN_URL}
- Email: ${employeeData.email}
- Temporary Password: ${employeeData.temporaryPassword}

SECURITY INSTRUCTIONS:
- Please login using the above credentials.
- Change your password immediately after your first login.
- Do not share your password with anyone.

Regards,
${env.COMPANY_NAME} Team
Email: ${env.COMPANY_EMAIL}
Website: ${env.COMPANY_WEBSITE}
    `.trim();

    return await sendEmailWithRetry({
      to: employeeData.email,
      subject,
      htmlContent,
      textContent,
      replyTo: employeeData.hrEmail || env.COMPANY_EMAIL,
      employeeId: employeeData.employeeId,
      organizationId: employeeData.organizationId,
      emailType: 'welcome',
    });
  } catch (error: any) {
    const errorMsg = error?.message || 'Unexpected error sending welcome email';
    console.error('❌ Welcome email error:', error);
    return {
      success: false,
      message: errorMsg,
      errorMessage: errorMsg,
    };
  }
};

export const sendCustomEmail = async (
  to: string,
  subject: string,
  bodyContent: string,
  options: Partial<EmailSendOptions> & {
    templateOptions?: any;
  } = {}
): Promise<SendEmailResult> => {
  const htmlContent = generateBaseEmailLayout(bodyContent, options.templateOptions);

  return await sendEmailWithRetry({
    to,
    subject,
    htmlContent,
    ...options,
  });
};
