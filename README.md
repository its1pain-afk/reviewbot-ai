# 🤖 ReviewBot AI — دليل الإعداد الكامل

نظام ذكاء اصطناعي يرد تلقائياً على تقييمات Google Maps باللهجة السعودية.

---

## 📁 هيكل المشروع

```
reviewbot/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # Google OAuth
│   │   ├── locations/              # إدارة الفروع
│   │   │   └── discover/           # اكتشاف فروع GMB
│   │   ├── reviews/                # جلب التقييمات
│   │   ├── bot-config/[locationId] # إعدادات البوت
│   │   └── cron/sync-reviews/      # Cron مزامنة التقييمات
│   ├── dashboard/                  # لوحة التحكم
│   │   ├── page.tsx               # الرئيسية
│   │   ├── locations/             # الفروع
│   │   ├── reviews/               # التقييمات
│   │   └── bot/                   # إعدادات البوت
│   └── login/                     # صفحة الدخول
├── lib/
│   ├── auth.ts                    # NextAuth إعدادات
│   ├── gmb.ts                     # Google My Business API
│   ├── botEngine.ts               # محرك الذكاء الاصطناعي
│   └── prisma.ts                  # قاعدة البيانات
├── prisma/
│   └── schema.prisma              # نموذج البيانات
└── workers/
    └── reviewWorker.js            # Cron job المزامنة
```

---

## 🚀 خطوات الإعداد

### 1. إعداد Google Cloud Project

**أ. إنشاء مشروع:**
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. أنشئ مشروع جديد
3. فعّل هذه الـ APIs:
   - `Google My Business API`
   - `Business Profile API`  
   - `My Business Account Management API`
   - `My Business Business Information API`

**ب. إنشاء OAuth Credentials:**
1. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
2. Application type: **Web application**
3. Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://yourdomain.com/api/auth/callback/google
   ```
4. احفظ الـ `Client ID` و `Client Secret`

**ج. OAuth Consent Screen:**
1. اختر External
2. أضف هذه الـ Scopes:
   - `https://www.googleapis.com/auth/business.manage`
3. أضف Test Users (بريدك الإلكتروني)
4. **ملاحظة:** للنشر الكامل ستحتاج مراجعة من Google

---

### 2. إعداد قاعدة البيانات

```bash
# PostgreSQL محلي
createdb reviewbot

# أو استخدم Supabase/Neon (مجاني)
# https://supabase.com أو https://neon.tech
```

---

### 3. إعداد ملف البيئة

```bash
cp .env.example .env
```

ثم عدّل `.env`:

```env
DATABASE_URL="postgresql://localhost:5432/reviewbot"
NEXTAUTH_SECRET="اكتب-هنا-نص-عشوائي-طويل-32-حرف-على-الأقل"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="من-Google-Cloud-Console"
GOOGLE_CLIENT_SECRET="من-Google-Cloud-Console"
ANTHROPIC_API_KEY="من-anthropic.com/api"
CRON_SECRET="نص-عشوائي-آخر"
```

---

### 4. التثبيت والتشغيل

```bash
# تثبيت الحزم
npm install

# إنشاء جداول قاعدة البيانات
npx prisma db push

# تشغيل المشروع
npm run dev
```

افتح المتصفح على: **http://localhost:3000**

---

### 5. تشغيل الـ Cron Worker

في terminal منفصل:

```bash
node workers/reviewWorker.js
```

هذا يشغّل مزامنة تلقائية كل ساعتين.

---

## 🔄 كيف يعمل النظام؟

```
المستخدم يسجل دخول بـ Google
           ↓
النظام يجلب قائمة فروعه من GMB
           ↓
المستخدم يختار الفروع ويضيفها
           ↓
Worker يمزامن التقييمات كل 2 ساعة
           ↓
البوت يولد ردوداً بالذكاء الاصطناعي
           ↓
الردود تُنشر تلقائياً على Google Maps
```

---

## 🌐 النشر على Vercel

```bash
# تثبيت Vercel CLI
npm i -g vercel

# النشر
vercel deploy

# إضافة متغيرات البيئة في Vercel Dashboard
```

**ملاحظة:** Cron Worker لا يعمل على Vercel.
استخدم [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) أو Railway/Render لتشغيله.

---

## 📊 APIs المستخدمة

| API | الغرض | التكلفة |
|-----|-------|---------|
| Google My Business API | جلب الفروع والتقييمات والرد عليها | مجانية |
| Claude AI (Anthropic) | توليد الردود الذكية | ~$0.01 لكل 100 رد |
| NextAuth | تسجيل الدخول بـ Google | مجانية |
| PostgreSQL | حفظ البيانات | مجانية (Neon/Supabase) |

---

## 💡 ملاحظات مهمة

1. **حدود GMB API:** 
   - جلب التقييمات: 5 طلبات/ثانية
   - الرد على التقييم: 1 طلب/ثانية
   - البوت يراعي هذه الحدود تلقائياً

2. **مراجعة Google:**
   - لاستخدام GMB API مع مستخدمين خارجيين، ستحتاج **OAuth App Verification** من Google
   - تستغرق المراجعة 1-4 أسابيع
   - للاختبار يمكنك إضافة حسابات كـ Test Users

3. **أمان الـ Tokens:**
   - Google refresh tokens محفوظة في قاعدة البيانات
   - تأكد من تشفير قاعدة البيانات في الإنتاج

---

## 🔧 إضافة ميزات جديدة

### Analytics Dashboard
أضف في `app/dashboard/analytics/page.tsx`:
- رسوم بيانية للتقييمات عبر الزمن
- مقارنة بين الفروع
- أكثر الكلمات تكراراً في التقييمات

### نظام الدفع
استخدم **Stripe** أو **Moyasar** (للسعودية):
```bash
npm install @stripe/stripe-js
```

### تنبيهات WhatsApp
استخدم **WhatsApp Business API** للتنبيه عند وصول تقييم 1-2 نجوم.
