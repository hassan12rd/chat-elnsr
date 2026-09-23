# Chat Railway

شات ويب خفيف مبني بـ Node.js + Express + Socket.IO.

## التشغيل محلياً
npm install
npm start

## Railway
ارفع الملفات إلى GitHub ثم أنشئ Service جديد في Railway من المستودع.
Railway سيستخدم `npm start` تلقائياً.

لا تضبط PORT يدوياً؛ السيرفر يقرأ PORT الذي توفره Railway.

## ملاحظة
هذه النسخة تحفظ آخر 100 رسالة في ذاكرة السيرفر فقط. لإنتاج حقيقي مع بقاء الرسائل بعد إعادة التشغيل، اربط PostgreSQL/Redis.
