# Debug Session: welcome-email-not-sent

**Status:** [OPEN]
**Created:** 2026-08-09
**Session ID:** welcome-email-not-sent
**Issue:** Employee create karne par Brevo se welcome email nahi ja raha. Employee DB save ho jata hai par email receive nahi hota.

---

## 🔍 Symptoms (Observed vs Expected)

| Item | Observed | Expected |
|---|---|---|
| Employee creation in MongoDB | ✅ Works | ✅ |
| API response success | ✅ 201/200 | ✅ |
| Welcome email received by employee | ❌ Not received | ✅ Should arrive within 30s |
| Server logs (Brevo send) | TBD | TBD |
| EmailLog collection entry | TBD | TBD |

---

## 🧪 Falsifiable Hypotheses (3-5)

### H1: Environment Variables Missing / Invalid
Brevo ke `.env` variables set hi nahi ya galat hain.
- `BREVO_API_KEY` empty/dummy/expired hai
- `BREVO_SENDER_EMAIL` empty ya Brevo mein verified nahi hai
- Test karne ke liye: Server startup logs mein Brevo initialization check karo — "⚠️ Brevo configuration invalid" warning aayega agar galat hai.

### H2: Brevo Sender Email Not Verified
`BREVO_SENDER_EMAIL` Brevo dashboard mein verified nahi hai. Brevo bina verified sender ke reject kar deta hai.
- HTTP 400 ya 401 error aayega Brevo response mein.
- EmailLog mein `status: failed` with message containing "sender" / "invalid" / "unauthorized".

### H3: Employee Email Domain Blocked / Invalid
Employee ka email address galat hai ya Brevo ne us domain ko block/blacklist kar rakha hai.
- Error: "Invalid email address" ya hard bounce log hoga.
- `isValidEmail()` function false return karega.

### H4: API Call Execute Hi Nahi Ho Raha (Silent Skip)
Code path mein email step skip ho raha hai. For example:
- `getBrevoClient()` null return karta hai → validation fail hone par early return ho jata hai without retry.
- Bulk import ya single create mein se kisi ek flow mein call missing hai.

### H5: Type/API Mismatch → Runtime Error (Catch Chup Raha)
Previous Brevo v5 → v6 migration mein sahi type/method use nahi kiya gaya, resulting in runtime error jo try-catch mein swallow ho raha hai.
- Error: `brevoClient.transactionalEmails.sendTransacEmail is not a function`
- Ya `undefined.method()` pattern se error.

---

---

## 📝 Evidence Log (Runtime)

**Run 1: test-brevo-debug.ts standalone test** — 2026-08-09:
- HTTP 401 unauthorized → `"Key not found"`
- .env mein key: `xsmtpsib-6d64...` (SMTP KEY — WRONG FORMAT ❌)

**Run 2: Actual server employee creation runtime logs (user provided)** — 2026-08-09:
```
✅ BrevoClient initialized (validation pass — empty string check only)
📧 Employee: traxal405@gmail.com
📤 Attempt 1/3 send to Brevo → FAIL: 401 unauthorized "Key not found" [code: unauthorized]
❌ Non-retryable error → abort retries
❌ PERMANENT FAIL: Key not found
```

Slack secondary error also present (token type wrong) but unrelated.

**Key observation:** Employee creation flow + email step **100% correctly triggered**. Code flow = fully working. Only credential issue remains.

---

## 🧪 Hypothesis Status (Final)

| # | Hypothesis | Status | Evidence |
|---|---|---|---|
| **H1** | **API KEY WRONG FORMAT** (xsmtpsib SMTP key vs xkeysib V3 key) | 🎯 **CONFIRMED** | Both tests fail with HTTP 401 `"Key not found"` |
| H2 | Sender email verification | ⚠️ PENDING | Key sahi hone ke baad hi testable |
| H3 | Employee email invalid | ❌ REJECTED | Same error on test email too |
| H4 | Code path skip | ❌ REJECTED | Clear "Attempt 1/3" logs |
| H5 | API mismatch/runtime | ❌ REJECTED | Method call works, Brevo returns HTTP response |

---

## 🔨 Root Cause & Fix

### Root Cause (100% CONFIRMED)
`.env` ke `BREVO_API_KEY` mein **Brevo SMTP KEY** (prefix: `xsmtpsib-`) dala gaya hai.
`@getbrevo/brevo` **SDK = REST client** hai. Isko **Brevo V3 REST API KEY** (prefix: `xkeysib-`) chahiye.

Brevo 401 `"Key not found"` = exact standard error jab wrong key type use karo.

### Fix Required
User:
1. Brevo Dashboard → **SMTP & API** → **API KEYS** tab (NOT "SMTP KEYS")
2. V3 key generate karo → prefix `xkeysib-...`
3. `server/.env` line #33 replace karo:
   - OLD: `BREVO_API_KEY=xsmtpsib-6d64...`
   - NEW: `BREVO_API_KEY=xkeysib-abc123...`
4. Save file → server restart

---

## ✅ Verification

TBD — jaise hi user V3 key dalega, test run karenge.

