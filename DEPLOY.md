# ملفات النشر والاستضافة

المشروع أصبح يحتوي على ملفات جاهزة لـ Node.js وRender وRailway وDocker.

## الخيار 1: Railway

Railway مناسب لتطبيق الشات الحالي لأنه يشغل Node.js ويدعم WebSocket، ويمكن إضافة Volume لحفظ SQLite.

1. ارفع المشروع إلى GitHub.
2. في Railway أنشئ Project ثم Service من مستودع GitHub.
3. اترك Build كما هو أو استخدم `npm install`.
4. Start Command:
   `npm start`
5. أضف Volume للمشروع.
6. اجعل Mount Path:
   `/data`
7. أضف المتغير:
   `DB_PATH=/data/chat.sqlite`
8. Generate Domain.
9. افتح الدومين.

المشروع يحتوي `railway.json` وHealth Check على `/health`.

## الخيار 2: Render

1. ارفع المشروع إلى GitHub.
2. اربطه كـ Web Service.
3. Build Command:
   `npm install`
4. Start Command:
   `npm start`
5. Health Check:
   `/health`
6. المتغيرات:
   `NODE_ENV=production`
   `DB_PATH=/data/chat.sqlite`
7. إذا أردت استمرار SQLite بين عمليات إعادة التشغيل والنشر، أضف Persistent Disk بمسار `/data`.

ملاحظة: نظام الملفات الافتراضي في Render مؤقت، لذلك SQLite بدون تخزين دائم لن يكون مناسباً للإنتاج.

## الخيار 3: Docker

```bash
docker build -t chat-elnsr .
docker run -p 3000:3000 -v chatdata:/data chat-elnsr
```

ثم افتح:
`http://localhost:3000`

## الدومين

بعد إنشاء الخدمة، استخدم الدومين الذي توفره منصة الاستضافة أو اربط دوميناً خاصاً من إعدادات Custom Domain.

## قبل الإطلاق العام

يفضل إضافة:
- تسجيل حساب بالبريد/رقم الهاتف أو OAuth.
- JWT أو جلسات آمنة.
- Rate limiting.
- نظام حظر وكتم.
- صلاحيات مشرفين.
- فلترة الرسائل والروابط.
- رفع الصور إلى Object Storage بدلاً من تخزينها داخل السيرفر.
- نسخ احتياطية للقاعدة.
- HTTPS.
- مراقبة السجلات والأخطاء.

### المصادر الرسمية
Render: https://render.com/docs
Railway: https://docs.railway.com/
