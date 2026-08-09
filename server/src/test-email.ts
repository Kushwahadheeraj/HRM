import 'dotenv/config';
import nodemailer from 'nodemailer';
import {
  generateEmployeeWelcomeTemplate,
  generateEmployeeWelcomeSubject,
  EmployeeWelcomeData,
} from './templates/employeeWelcomeTemplate';
import { generateSecurePassword } from './utils/password';

const TEST_RECIPIENT_EMAIL = process.env.TEST_EMAIL_TO || 'dheeraj01072001@gmail.com';

const getEnv = (key: string, fallback: string = ''): string => {
  const val = process.env[key] || fallback;
  return typeof val === 'string' ? val.replace(/^"|"$/g, '').replace(/^'|'$/g, '') : val;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function testSmtpConnection() {
  console.log('\n========================================');
  console.log('🧪  TEST 1: SMTP Connection Verification');
  console.log('========================================\n');

  const smtpHost = getEnv('SMTP_HOST') || (getEnv('EMAIL_USER') ? 'smtp.gmail.com' : '');
  const smtpPort = Number(getEnv('SMTP_PORT') || '587');
  const smtpUser = getEnv('SMTP_USER') || getEnv('EMAIL_USER');
  const smtpPass = getEnv('SMTP_PASS') || getEnv('EMAIL_PASS');
  const smtpFrom = getEnv('SMTP_FROM') || smtpUser;

  console.log('📋 SMTP Configuration detected:');
  console.log('   Host    :', smtpHost);
  console.log('   Port    :', smtpPort);
  console.log('   User    :', smtpUser ? `✅ ${smtpUser}` : '❌ MISSING');
  console.log('   Pass    :', smtpPass ? `✅ ${'*'.repeat(Math.min(8, smtpPass.length))}` : '❌ MISSING');
  console.log('   From    :', smtpFrom);
  console.log('   Secure  :', smtpPort === 465 ? 'SSL (465)' : smtpPort === 587 ? 'TLS/STARTTLS (587)' : 'Default');
  console.log('');

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('❌ Aborting - SMTP credentials incomplete. Please fill .env file.');
    return { connected: false, transporter: null };
  }

  const authObj: any = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  };
  if (smtpPort === 587) authObj.requireTLS = true;

  try {
    const transporter = nodemailer.createTransport(authObj);
    console.log('🔌 Attempting SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP CONNECTION SUCCESSFUL! Server accepted credentials.\n');
    return { connected: true, transporter, smtpFrom, smtpUser };
  } catch (error: any) {
    console.error('❌ SMTP CONNECTION FAILED!\n');
    console.error('Error Message:', error?.message);
    console.error('Error Code   :', error?.code);
    console.error('Error Command:', error?.command);
    if (error?.response) {
      console.error('Server Response:', String(error.response).slice(0, 1000));
    }
    console.log('\n💡 TROUBLESHOOTING HINTS:');
    console.log('   - GMAIL users: You MUST use an "App Password", NOT your regular Gmail password.');
    console.log('     1. Go to https://myaccount.google.com/security');
    console.log('     2. Enable "2-Step Verification" (required)');
    console.log('     3. Go to "App passwords" > create one for "Mail" > use that as SMTP_PASS');
    console.log('   - Double-check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env');
    console.log('   - Gmail ports: 587 (TLS) OR 465 (SSL)\n');
    return { connected: false, transporter: null };
  }
}

async function testSendSimpleEmail(transporter: any, fromAddress: string) {
  console.log('\n========================================');
  console.log('🧪  TEST 2: Send Simple Plain Text Email');
  console.log('========================================\n');

  const to = TEST_RECIPIENT_EMAIL;
  console.log(`📤 Sending simple test email to: ${to}`);

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      replyTo: getEnv('COMPANY_EMAIL', 'support@traxale.com'),
      subject: '[TEST 1] SMTP Simple Email - Traxale HRMS',
      text: `Hello from Traxale HRMS!

If you received this email, your SMTP configuration is working correctly.

Test Details:
- Time: ${new Date().toISOString()}
- Server: ${getEnv('SMTP_HOST') || 'smtp.gmail.com'}
- This is a plain text test email.

-- 
Traxale HRMS Team
${getEnv('COMPANY_WEBSITE', 'https://traxale.com')}
`,
      html: `<div style="font-family:Arial,sans-serif;padding:20px;background:#f0f4f8;">
        <div style="background:white;padding:24px;border-radius:12px;max-width:500px;margin:0 auto;">
          <h2 style="color:#1e40af;margin-top:0;">✅ SMTP Test Successful</h2>
          <p style="font-size:15px;color:#333;line-height:1.6;">
            If you received this email, your SMTP configuration is working correctly.
          </p>
          <div style="background:#eff6ff;padding:14px;border-radius:8px;margin-top:16px;">
            <div style="font-size:13px;color:#1e40af;margin-bottom:4px;"><strong>Test Details:</strong></div>
            <div style="font-size:13px;color:#374151;">⏰ Time: ${new Date().toLocaleString()}</div>
            <div style="font-size:13px;color:#374151;">🖥️ Server: ${getEnv('SMTP_HOST') || 'smtp.gmail.com'}</div>
            <div style="font-size:13px;color:#374151;">📧 This is a simple HTML test email.</div>
          </div>
        </div>
      </div>`,
    });
    console.log('✅ SIMPLE EMAIL SENT SUCCESSFULLY!');
    console.log('   Message ID :', info.messageId);
    console.log('   Accepted   :', info.accepted);
    console.log('   Rejected   :', info.rejected);
    console.log(`   📬 Please check your inbox (or spam) at: ${to}`);
    return true;
  } catch (error: any) {
    console.error('❌ SIMPLE EMAIL FAILED!\n');
    console.error('Message :', error?.message);
    console.error('Code    :', error?.code);
    if (error?.response) console.error('Response:', String(error.response).slice(0, 800));
    return false;
  }
}

async function testSendWelcomeEmail(transporter: any, fromAddress: string) {
  console.log('\n========================================');
  console.log('🧪  TEST 3: Send Employee Welcome Email (Full HTML Template)');
  console.log('========================================\n');

  const to = TEST_RECIPIENT_EMAIL;
  const tempPassword = generateSecurePassword(12);
  console.log(`📝 Generated temp password: ${tempPassword}`);
  console.log(`📤 Sending full HTML welcome email to: ${to}`);

  const testEmployee: EmployeeWelcomeData = {
    employeeName: 'Dheeraj Kushwaha (Test Employee)',
    employeeId: 'TRX-TEST-001',
    email: to,
    temporaryPassword: tempPassword,
    department: 'Engineering',
    designation: 'Senior Software Engineer',
    role: 'Full Stack Developer',
    managerName: 'HR Manager',
    salary: 1200000,
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: 'Full-Time',
    officeLocation: 'Indore, Madhya Pradesh',
    phoneNumber: '+91 82993 01972',
    reportingManager: 'Product Manager',
    shift: 'General',
    workingHours: '9:00 AM - 6:00 PM',
    employeeStatus: 'active',
    loginUrl: getEnv('LOGIN_URL', 'http://localhost:5173/login'),
    hrName: 'HR Admin',
    hrEmail: 'hr@traxale.com',
  };

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      replyTo: 'hr@traxale.com',
      subject: generateEmployeeWelcomeSubject(),
      html: generateEmployeeWelcomeTemplate(testEmployee),
    });
    console.log('✅ WELCOME EMAIL (FULL HTML) SENT SUCCESSFULLY!');
    console.log('   Message ID :', info.messageId);
    console.log('   Accepted   :', info.accepted);
    console.log('   Rejected   :', info.rejected);
    console.log(`   📬 Check inbox: ${to}`);
    console.log(`   🔑 Temp password in email: ${tempPassword}`);
    return true;
  } catch (error: any) {
    console.error('❌ WELCOME EMAIL FAILED!\n');
    console.error('Message :', error?.message);
    console.error('Code    :', error?.code);
    if (error?.response) console.error('Response:', String(error.response).slice(0, 800));
    return false;
  }
}

async function main() {
  console.log('\n🔥 =========================================================');
  console.log('🔥    TRAXALE HRMS - EMAIL SERVICE DIAGNOSTIC TOOL');
  console.log('🔥 =========================================================');
  console.log(`⏰ Run Time: ${new Date().toLocaleString()}`);

  const { connected, transporter, smtpFrom, smtpUser } = await testSmtpConnection();
  if (!connected || !transporter) {
    console.log('\n❌ Stopping - cannot connect to SMTP server.\n');
    process.exit(1);
  }

  const fromAddress = smtpFrom || `"${getEnv('COMPANY_NAME', 'Traxale HRMS')}" <${smtpUser}>`;

  await sleep(1500);
  const test1Pass = await testSendSimpleEmail(transporter, fromAddress);

  await sleep(2500);
  const test2Pass = await testSendWelcomeEmail(transporter, fromAddress);

  console.log('\n========================================');
  console.log('📊 FINAL SUMMARY');
  console.log('========================================\n');
  console.log(`✅ SMTP Connection : ${connected ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Simple Email    : ${test1Pass ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Welcome Email   : ${test2Pass ? 'PASS' : 'FAIL'}`);

  const allPass = connected && test1Pass && test2Pass;
  console.log(`\n${allPass ? '🎉' : '⚠️'}  OVERALL: ${allPass ? 'ALL TESTS PASSED - Email system is working!' : 'Some tests FAILED - see errors above.'}\n`);

  if (!allPass) {
    console.log('💡 IF YOU ARE USING GMAIL - THE #1 ISSUE IS "App Password" not configured:');
    console.log('   Step 1: Open https://myaccount.google.com/');
    console.log('   Step 2: Go to Security');
    console.log('   Step 3: Enable "2-Step Verification" (MUST be ON)');
    console.log('   Step 4: Go to "App passwords" (search bar top)');
    console.log('   Step 5: App = Mail, Device = Windows Computer (or Other)');
    console.log('   Step 6: Copy the 16-char generated password WITHOUT SPACES');
    console.log('   Step 7: Paste into .env > SMTP_PASS= and EMAIL_PASS=');
    console.log('   Step 8: Run this test script again.\n');
  }
}

main().catch(e => {
  console.error('💥 Fatal error in test script:', e);
  process.exit(1);
});
