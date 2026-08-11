import { env } from '../config/env';
import { initBrevoClient, validateBrevoConfig, brevoConfig } from '../config/brevo';
import EmailLog from '../models/EmailLog.model';
import mongoose from 'mongoose';
import { BrevoClient, Brevo, type BrevoError } from '@getbrevo/brevo';
import fs from 'fs';
import path from 'path';
import {
  generateEmployeeWelcomeTemplate,
  generateEmployeeWelcomeSubject,
  EmployeeWelcomeData,
  generateBaseEmailLayout,
} from '../templates/employeeWelcomeTemplate';
import { isValidEmail } from '../utils/password';

export const LOGO_CID = 'company-logo-cid@traxale-hrm';

let cachedLogoBase64: string | null = null;
let cachedLogoAttempted = false;

const getLogoBase64 = async (): Promise<string | null> => {
  if (cachedLogoAttempted) return cachedLogoBase64;
  cachedLogoAttempted = true;
  try {
    const candidates = [
      path.join(__dirname, '..', 'assets', 'logo.png'),
      path.join(process.cwd(), 'dist', 'assets', 'logo.png'),
      path.join(process.cwd(), 'src', 'assets', 'logo.png'),
      path.join(process.cwd(), 'public', 'logo.png'),
      path.join(process.cwd(), '..', 'client', 'public', 'logo.png'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        cachedLogoBase64 = fs.readFileSync(p).toString('base64');
        console.log(`✅ [EmailService] Loaded logo for inline email attachment from: ${p}`);
        return cachedLogoBase64;
      }
    }

    try {
      const url = env.COMPANY_LOGO_URL;
      if (url && /^https?:\/\//i.test(url)) {
        console.log(`⏳ [EmailService] Local logo not found; trying to fetch from: ${url}`);
        const isHttps = url.toLowerCase().startsWith('https://');
        const httpModule = isHttps ? await import('https') : await import('http');
        const b64 = await new Promise<string | null>((resolve) => {
          const req = httpModule.get(url, (res: any) => {
            if (!res || res.statusCode !== 200) {
              try { res.resume(); } catch {}
              resolve(null);
              return;
            }
            const chunks: Buffer[] = [];
            res.on('data', (c: Buffer) => chunks.push(c));
            res.on('end', () => {
              try {
                const buf = Buffer.concat(chunks);
                if (buf.length > 100) resolve(buf.toString('base64'));
                else resolve(null);
              } catch {
                resolve(null);
              }
            });
            res.on('error', () => resolve(null));
          });
          req.on('error', () => resolve(null));
          req.setTimeout(8000, () => { try { req.destroy(); } catch {}; resolve(null); });
        });
        if (b64) {
          cachedLogoBase64 = b64;
          console.log(`✅ [EmailService] Fetched logo from URL: ${url}`);
          return cachedLogoBase64;
        }
      }
    } catch (fetchErr: any) {
      console.warn('⚠️  [EmailService] Failed to fetch logo from URL:', fetchErr?.message || fetchErr);
    }

    console.log('⚠️  [EmailService] Logo not found locally or via URL; template will use COMPANY_LOGO_URL as img src fallback');
    return null;
  } catch (err: any) {
    console.error('❌ [EmailService] Failed to read logo file:', err?.message || err);
    return null;
  }
};

export interface SendEmailResult {
  success: boolean;
  message: string;
  retryCount?: number;
  errorMessage?: string;
  brevoMessageId?: string;
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
    url?: string;
  }>;
  employeeId?: mongoose.Types.ObjectId | string;
  organizationId?: mongoose.Types.ObjectId | string;
  emailType?: string;
}

type SendTransacEmailRequest = Brevo.SendTransacEmailRequest;
type BrevoAttachmentItem = NonNullable<SendTransacEmailRequest['attachment']>[number];

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

let cachedBrevoClient: BrevoClient | null = null;
let clientInitAttempted = false;

const getBrevoClient = (): BrevoClient | null => {
  if (cachedBrevoClient) {
    return cachedBrevoClient;
  }
  if (!clientInitAttempted) {
    clientInitAttempted = true;
    cachedBrevoClient = initBrevoClient();
  }
  return cachedBrevoClient;
};

export const verifyBrevoConnection = async (): Promise<boolean> => {
  try {
    const validation = validateBrevoConfig();
    if (!validation.valid) {
      console.log('⚠️  [EmailService] Brevo credentials not configured:', validation.errors);
      return false;
    }
    const client = getBrevoClient();
    if (!client) {
      console.log('⚠️  [EmailService] Brevo client could not be initialized');
      return false;
    }
    console.log('✅ [EmailService] Brevo configuration verified');
    return true;
  } catch (error: any) {
    console.error('❌ [EmailService] Brevo connection verification FAILED:', error?.message || error);
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

const normalizeEmailList = (emails: string | string[] | undefined): Array<{ email: string; name?: string }> => {
  if (!emails) return [];
  const list = Array.isArray(emails) ? emails : [emails];
  return list
    .filter((e) => e && typeof e === 'string' && e.trim() !== '')
    .map((e) => ({ email: e.trim() }));
};

const buildBrevoAttachments = (
  attachments: EmailSendOptions['attachments']
): BrevoAttachmentItem[] | undefined => {
  if (!attachments || attachments.length === 0) return undefined;

  return attachments
    .filter((a) => a && (a.content || a.url))
    .map((a) => {
      const attachment: BrevoAttachmentItem = {};
      if (a.filename) attachment.name = a.filename;
      if (a.content) {
        if (typeof a.content === 'string') {
          attachment.content = a.content;
        } else {
          try {
            attachment.content = Buffer.from(a.content).toString('base64');
          } catch {
            attachment.content = String(a.content);
          }
        }
      }
      if (a.url) attachment.url = a.url;
      return attachment;
    });
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

  const validation = validateBrevoConfig();
  if (!validation.valid) {
    const errorMsg = `Brevo configuration incomplete: ${validation.errors.join(', ')}`;
    console.warn('⚠️ ', errorMsg);
    await logEmailDelivery(employeeId, to, subject, 'failed', 0, errorMsg, organizationId, emailType);
    return {
      success: false,
      message: errorMsg,
      retryCount: 0,
      errorMessage: errorMsg,
    };
  }

  const brevoClient = getBrevoClient();
  if (!brevoClient) {
    const errorMsg = 'Brevo email client not initialized. API key or configuration is missing.';
    console.warn('⚠️ ', errorMsg);
    await logEmailDelivery(employeeId, to, subject, 'failed', 0, errorMsg, organizationId, emailType);
    return {
      success: false,
      message: errorMsg,
      retryCount: 0,
      errorMessage: errorMsg,
    };
  }

  const senderName = brevoConfig.senderName || env.COMPANY_NAME;
  const senderEmail = brevoConfig.senderEmail || env.COMPANY_EMAIL;

  console.log('📧 [EmailService] Sending email via Brevo:', {
    to,
    from: `${senderName} <${senderEmail}>`,
    subject,
    replyTo: replyTo || env.COMPANY_EMAIL,
  });

  const smtpEmail: SendTransacEmailRequest = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [{ email: to }],
    subject,
    htmlContent,
  };

  if (textContent) {
    smtpEmail.textContent = textContent;
  }

  if (replyTo && isValidEmail(replyTo)) {
    smtpEmail.replyTo = {
      email: replyTo,
      name: replyTo,
    };
  }

  const ccList = normalizeEmailList(cc);
  if (ccList.length > 0) smtpEmail.cc = ccList;

  const bccList = normalizeEmailList(bcc);
  if (bccList.length > 0) smtpEmail.bcc = bccList;

  const brevoAttachments = buildBrevoAttachments(attachments);
  if (brevoAttachments && brevoAttachments.length > 0) {
    smtpEmail.attachment = brevoAttachments;
  }

  const logoB64 = await getLogoBase64();
  if (logoB64 && smtpEmail.htmlContent) {
    const inlineLogo: BrevoAttachmentItem = {
      name: 'logo.png',
      content: logoB64,
    };
    (inlineLogo as any).cid = LOGO_CID;
    smtpEmail.attachment = smtpEmail.attachment
      ? [inlineLogo, ...smtpEmail.attachment]
      : [inlineLogo];
    smtpEmail.htmlContent = smtpEmail.htmlContent
      .split(`src="${env.COMPANY_LOGO_URL}"`)
      .join(`src="cid:${LOGO_CID}"`);
  }

  let lastError: any = null;
  let brevoMessageId: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`📤 [EmailService] Attempt ${attempt}/${maxAttempts} - sending Brevo email to ${to}...`);

      const response: any = await brevoClient.transactionalEmails.sendTransacEmail(smtpEmail);
      brevoMessageId = response?.messageId || (response as any)?.body?.messageId || undefined;

      console.log(`✅ [EmailService] Brevo email sent (attempt ${attempt}/${maxAttempts}):`, {
        to,
        brevoMessageId,
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
        brevoMessageId,
      };
    } catch (error: any) {
      lastError = error;
      const isBrevoError = (error as any)?.name?.includes('Brevo') || 'statusCode' in (error as any);
      const brevoBody = (error as BrevoError)?.body as any;
      const errorBody = brevoBody || (error as any)?.response?.body || (error as any)?.body;
      const brevoCode = errorBody?.code || (error as any)?.code;
      const brevoMessage = errorBody?.message || (error as any)?.message;
      const httpStatus = (error as BrevoError)?.statusCode || (error as any)?.status || (error as any)?.response?.statusCode;

      console.error(`❌ [EmailService] Failed Brevo attempt ${attempt}/${maxAttempts} to ${to}:`, {
        message: brevoMessage,
        code: brevoCode,
        httpStatus,
        isBrevoError,
      });

      const nonRetryableCodes = ['invalid_parameter', 'unauthorized', 'authentication_failed'];
      const nonRetryableStatuses = [400, 401, 403, 404, 422];
      if (
        nonRetryableCodes.includes(brevoCode) ||
        nonRetryableStatuses.includes(httpStatus)
      ) {
        console.error(`❌ [EmailService] Non-retryable Brevo error (${brevoCode || httpStatus}), aborting retries.`);
        break;
      }

      if (attempt < maxAttempts) {
        console.log(`⏳ [EmailService] Retrying in ${retryDelay}ms...`);
        await sleep(retryDelay);
      }
    }
  }

  const brevoBody = (lastError as BrevoError)?.body as any;
  const errorMsg = brevoBody?.message || lastError?.response?.body?.message || lastError?.message || `Failed to send email after ${maxAttempts} attempts`;
  const errorCode = brevoBody?.code || lastError?.code || lastError?.response?.body?.code;
  const errorDetails = errorCode
    ? ` [Code: ${errorCode}]`
    : '';
  console.error(`❌ [EmailService] PERMANENT FAIL after ${maxAttempts} attempts to ${to}: ${errorMsg}${errorDetails}`);

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

Your employee account has been created successfully.

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
