# Welcome Email Debug - ACTION REQUIRED 🔧

## ✅ Root Cause Confirm Ho Gaya!

**Issue:** Employee create karne par email nahi ja raha
**Cause:** Brevo API Key **GALAT FORMAT** mein hai

### 🔍 Kya Galat Hai?

Aapke `.env` mein jo key hai:
```
BREVO_API_KEY=xsmtpsib-6d647fc3fe208eeb0955b46c83c46044b51642fbd389c4c9b2e610ab6eae7006-1Czu2WgdJ0SN82lR
```

Yeh **`xsmtpsib-`** prefix wali key = **Brevo SMTP RELAY KEY** hai (SMTP protocol ke liye use hoti hai).

### ✅ Correct API Key Format Kya Hona Chahiye?

Humare `@getbrevo/brevo` Node.js SDK ko **Brevo V3 REST API KEY** chahiye jo **`xkeysib-`** prefix se start hota hai.

Example correct key:
```
BREVO_API_KEY=xkeysib-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567ab890cd123ef-AA1BB2CC3DD4EE5FF6GG7HH8
```
---

## 🚀 Fix Karne ke 6 Simple Steps

### Step 1: Brevo Dashboard Login Karo
👉 https://app.brevo.com/

Email/password se login karo jis account se aapne key generate ki hai.

### Step 2: API Keys Page Par Jao
👉 Direct link: https://app.brevo.com/settings/keys/api

Ya phir:
- Top right mein apne profile name/logo par click karo
- **SMTP & API** (ya "Settings" → "SMTP & API") select karo
- **API KEYS** tab par click karo

### Step 3: Naya API Key Generate Karo
1. **"Generate a new API key"** button click karo
2. Name field mein likho: `traxale-hrm-backend-production` ya koi meaningful name
3. Version = **V3** (default hi rehne do)
4. **"Generate"** par click karo

⚠️ **IMPORTANT:** Ab ek popup mein naya key dikhega — ise **ek baar hi copy kar sakte ho!**

### Step 4: Copy Paste Woh Naya Key
New generated key `xkeysib-...` se start hoga. Ise copy karo.

### Step 5: Backend `.env` File Mein Update Karo
File location: `server/.env`

Yeh line dhoondo (line #33 around):
```
BREVO_API_KEY=xsmtpsib-6d647fc3fe208eeb0955b46c83c46044b51642fbd389c4c9b2e610ab6eae7006-1Czu2WgdJ0SN82lR
```

Is line ko DELETE ya COMMENT karo aur NAYI line paste karo:
```
BREVO_API_KEY=xkeysib-YAHAN_NIYA_KEY_PASTE_KARO
```

### Step 6: Server Restart + Test Karo (Hum Iske Baad Automation se karenge)
Aap Step 1-5 karo, jaise hi aap update karoge hum automatic:
- Test script run karenge Brevo API call ke liye
- Agar success aaya to actual employee create karke full flow verify karenge
- Sab kuch logs ke saath dikhayenge

---

## ⚡ Quick Troubleshooting (Agar Step 3 mein V3 key na mile)

Agar API Keys page par sirf SMTP keys dikh rahi hain:
1. Tab switch karo — "SMTP Keys" aur "API Keys" alag-alag hote hain
2. Confirm karo ki tum "API Keys" tab (aur SMTP Keys nahi) par ho
3. Us tab mein hi "Generate new API key" button hoga
4. V3 automatically selected rahega, V2 mat use karna

---

## 📋 Checklist

| Step | Description | Done? |
|---|---|---|
| 1 | Brevo dashboard login | ⏳ |
| 2 | SMTP & API → API Keys tab open | ⏳ |
| 3 | Naya V3 API key generate (xkeysib-...) | ⏳ |
| 4 | Copy key securely | ⏳ |
| 5 | server/.env → BREVO_API_KEY replace | ⏳ |
| 6 | Humara test script run hoga | 🔜 Auto by Trae |

---

Jaise hi .env update kar doge, **mujhe bas "done" ya "updated" likho message mein**, main 2 seconds mein full test chala dunga! 🚀
