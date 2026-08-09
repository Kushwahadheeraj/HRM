import 'dotenv/config';
import { env } from './config/env';
import { validateBrevoConfig, initBrevoClient } from './config/brevo';

console.log('🧪 ========================================');
console.log('🧪  BREVO DIAGNOSTIC TEST');
console.log('🧪 ========================================\n');

console.log('📋 Step 1: Environment Variables Load Check');
const apiKeyMask = env.BREVO_API_KEY ? env.BREVO_API_KEY.substring(0, 8) + '...' : '❌ MISSING';
console.log('   BREVO_API_KEY       :', apiKeyMask);
console.log('   BREVO_SENDER_EMAIL  :', env.BREVO_SENDER_EMAIL ? '✅ ' + env.BREVO_SENDER_EMAIL : '❌ MISSING');
console.log('   BREVO_SENDER_NAME   :', env.BREVO_SENDER_NAME ? '✅ ' + env.BREVO_SENDER_NAME : '❌ MISSING');
console.log('   FRONTEND_URL        :', env.FRONTEND_URL || '❌ MISSING');
console.log('');

console.log('📋 Step 2: validateBrevoConfig() Check');
const validation = validateBrevoConfig();
console.log('   Valid  :', validation.valid ? '✅ YES' : '❌ NO');
if (validation.errors.length > 0) {
  console.log('   Errors :');
  validation.errors.forEach((e: string) => console.log('     ❌ - ' + e));
}
console.log('');

console.log('📋 Step 3: BrevoClient Init Check');
const client = initBrevoClient();
console.log('   Client created:', client ? '✅ BrevoClient instance' : '❌ NULL returned');
console.log('');

if (!client) {
  console.log('❌ Cannot proceed. Client is NULL.');
  console.log('\n💡 Likely cause: H1 confirmed — env vars missing/invalid.');
  process.exit(1);
}

console.log('📋 Step 4: Check client.transactionalEmails object exists (H5 check)');
const hasTransactional = (client as any).transactionalEmails;
console.log('   transactionalEmails property:', hasTransactional ? '✅ EXISTS' : '❌ UNDEFINED (API MISMATCH!)');
if (hasTransactional) {
  console.log('   sendTransacEmail method:', typeof hasTransactional.sendTransacEmail);
  console.log('   typeof check:', typeof hasTransactional.sendTransacEmail === 'function' ? '✅ FUNCTION' : '❌ NOT A FUNCTION');
}
console.log('');

console.log('📋 Step 5: Try simple transactionalEmails.sendTransacEmail with minimal request');
const TEST_TO = process.env.TEST_EMAIL_TO || 'dheeraj01072001@gmail.com';
console.log('   Will attempt to send a test email to:', TEST_TO);

(async () => {
  try {
    const testPayload = {
      sender: {
        name: env.BREVO_SENDER_NAME,
        email: env.BREVO_SENDER_EMAIL,
      },
      to: [{ email: TEST_TO }],
      subject: '[BREVO DIAGNOSTIC TEST] Traxale HRM',
      htmlContent: `<div style="font-family:Arial,sans-serif;padding:30px;background:#f0f4f8;">
        <div style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:#fff;padding:30px;border-radius:12px;">
          <h1 style="margin:0;">✅ Brevo Test Success</h1>
        </div>
        <div style="background:#fff;padding:30px;margin-top:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <p style="font-size:16px;color:#333;">Agar aapko yeh email mil gaya, toh Brevo integration bilkul theek kaam kar raha hai!</p>
          <p style="font-size:14px;color:#666;">Time: <strong>${new Date().toISOString()}</strong></p>
        </div>
      </div>`,
    };

    console.log('   📤 Sending test request to Brevo...');
    console.log('   Payload keys:', Object.keys(testPayload));

    const result = await (client as any).transactionalEmails.sendTransacEmail(testPayload);
    console.log('');
    console.log('✅ Step 5 RESULT: ✅ API CALL SUCCESS');
    console.log('   Result type:', typeof result);
    console.log('   Result keys:', Object.keys(result || {}));
    console.log('   Full result:', JSON.stringify(result, null, 2).substring(0, 1500));
    console.log('');
    console.log('🎉 SUCCESS! If email inbox mein aaya within 60 seconds, Brevo is WORKING.');
    console.log('   → Problem = Employee controller se call nahi ho raha. Check flow.');
    process.exit(0);
  } catch (error: any) {
    console.log('');
    console.log('❌ Step 5 RESULT: ❌ API CALL FAILED');
    console.log('');
    console.log('   Error name       :', error?.name || 'N/A');
    console.log('   Error message    :', error?.message || 'N/A');
    console.log('   Error statusCode :', (error as any)?.statusCode || 'N/A');
    console.log('   Error code       :', (error as any)?.code || ((error as any)?.body?.code) || 'N/A');
    if ((error as any)?.body) {
      console.log('   Error body       :', JSON.stringify((error as any).body, null, 2));
    }
    if ((error as any)?.stack) {
      console.log('   Stack (first 800):', String((error as any).stack).substring(0, 800));
    }
    console.log('');
    console.log('💡 HINTS based on error:');
    const status = (error as any)?.statusCode;
    const msg = String((error as any)?.body?.message || error?.message || '');
    if (status === 401) {
      console.log('   → H1+H2: API key galat hai ya expired. Brevo dashboard se naya key generate karo.');
    } else if (status === 400) {
      if (msg.toLowerCase().includes('sender')) {
        console.log('   → H2: Sender email (' + env.BREVO_SENDER_EMAIL + ') Brevo mein verified nahi hai.');
        console.log('   → Visit https://app.brevo.com/settings/senders par jao aur sender verify karo.');
      } else {
        console.log('   → H2: Request payload invalid. Brevo error message padho.');
        console.log('   → Message:', msg);
      }
    } else if ((error as any)?.message && /not a function|undefined/.test((error as any).message)) {
      console.log('   → H5: API method name mismatch. Check v5 vs v6 API usage pattern.');
    } else {
      console.log('   → General network/unknown issue:', msg);
    }
    process.exit(1);
  }
})();
