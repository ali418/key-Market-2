# نظام إدارة المبيعات والمخزون للبقالة

هذا الدليل يوضح كل ما تحتاجه لتشغيل النظام على جهاز آخر، بخيارات تشغيل محلي أو باستخدام Docker.

## 1) المتطلبات الأساسية
- نظام التشغيل: Windows 10/11 أو macOS أو Linux
- Node.js (موصى به: 18.16.0) + npm
- PostgreSQL (موصى به: 14 أو أحدث)
- Git (اختياري)
- Docker Desktop + Docker Compose (اختياري للتشغيل بالحاويات)

ملاحظة: يوجد ملف .nvmrc يحدد نسخة Node: 18.16.0.

## 2) نسخ المشروع
- انسخ المجلد أو استنسخه عبر Git إلى جهازك الجديد.

## 3) إعداد ملفات البيئة (.env)
قم بإنشاء ملفات البيئة التالية (يمكنك النسخ من .env.example وتعديل القيم):

- backend/.env
  - NODE_ENV=development
  - BACKEND_PORT=3002 (أو منفذ فارغ آخر)
  - API_PREFIX=/api/v1
  - DB_HOST=localhost (أو postgres عند استخدام Docker)
  - DB_PORT=5432
  - DB_NAME=grocery_management
  - DB_USER=postgres
  - DB_PASSWORD=postgres
  - JWT_SECRET=ضع_قيمة_عشوائية_قوية
  - JWT_EXPIRES_IN=24h
  - JWT_REFRESH_SECRET=ضع_قيمة_عشوائية_قوية
  - JWT_REFRESH_EXPIRES_IN=7d
  - CORS_ORIGIN=http://localhost:3000
  - UPLOAD_DIR=uploads
  - MAX_FILE_SIZE=5242880
  - RATE_LIMIT_WINDOW_MS=900000
  - RATE_LIMIT_MAX=100

- frontend/.env
  - REACT_APP_API_URL=http://localhost:3002/api/v1
  - REACT_APP_AUTH_STORAGE_KEY=grocery_management_auth
  - REACT_APP_DEFAULT_LANGUAGE=ar
  - REACT_APP_ENABLE_DARK_MODE=true
  - REACT_APP_ENABLE_NOTIFICATIONS=true

تأكد من تطابق المنفذ المستخدم في REACT_APP_API_URL مع BACKEND_PORT في الباكند.

## 4) تثبيت التبعيات
- تثبيت باكند:
  - npm --prefix backend install
- تثبيت فرونت إند:
  - npm --prefix frontend install

## 5) تهيئة قاعدة البيانات
- تأكد من تشغيل PostgreSQL والوصول إليه.
- أنشئ قاعدة بيانات باسم grocery_management (إن لم تكن موجودة).
- شغل الهجرات:
  - npm --prefix backend run db:migrate
- اختياري: شغل البذور (Seeders) لبيانات تجريبية:
  - npm --prefix backend run db:seed

بديل: يوجد ملف MANUAL_DB_SETUP.md إذا رغبت بإعداد الجداول يدويًا.

## 6) تشغيل الخوادم محليًا
- تشغيل الواجهة الخلفية (باكند):
  - npm --prefix backend run dev
  - سيسمع افتراضيًا على المنفذ 3002 (يمكن تغييره عبر BACKEND_PORT)
- تشغيل الواجهة الأمامية (فرونت إند):
  - npm --prefix frontend run start
  - ستعمل افتراضيًا على المنفذ 3000

افتح المتصفح على:
- الواجهة الأمامية: http://localhost:3000
- واجهة API: http://localhost:3002/api/v1

ملاحظة: أثناء التطوير، ملف frontend/src/setupProxy.js يوجّه الطلبات إلى http://localhost:3002؛ إذا عدّلت BACKEND_PORT أو REACT_APP_API_URL عدّل هذا الملف بما يتوافق.

## 7) التشغيل باستخدام Docker (اختياري)
- تأكد من ضبط القيم البيئية في docker-compose.yml بما يتوافق مع منافذ التطبيق.
- شغّل:
  - docker-compose up -d
- بعد بدء الحاويات، نفّذ الهجرات داخل حاوية الباكند عند الحاجة:
  - docker exec -it grocery-backend npm run db:migrate

ملاحظات مهمة:
- المنافذ الافتراضية في docker-compose الحالي:
  - Frontend: http://localhost:3005 (خريطة المنافذ 3005:3000)
  - Backend API: http://localhost:3001 (خريطة المنافذ 3001:3001)
  - PgAdmin: http://localhost:5050 (البيانات الافتراضية: البريد admin@example.com، كلمة المرور admin)
- إذا كان الخادم داخل الحاوية يستخدم BACKEND_PORT=3002 افتراضيًا، فقم إما بـ:
  - تعيين BACKEND_PORT=3001 في خدمة backend داخل docker-compose (موصى به)، أو
  - تعديل خريطة المنافذ إلى 3002:3002 إن أردت الإبقاء على 3002 داخل الحاوية.
- حدّث الواجهة الأمامية لتشير إلى منفذ الـ API الصحيح:
  - REACT_APP_API_URL=http://localhost:3001/api/v1 عند استخدام docker-compose الافتراضي أعلاه.
- تأكد من ضبط CORS_ORIGIN في الباكند ليتطابق مع منفذ الواجهة الأمامية:
  - مثال: CORS_ORIGIN=http://localhost:3005 عند تشغيل الواجهة الأمامية من الحاوية بالمنفذ 3005.

## 8) إعدادات الرفع والصور
- مجلد الرفع الافتراضي: backend/uploads
- الباكند يقدّم الملفات الثابتة عبر المسار /uploads
- تأكد من وجود المجلد وصلاحيات الكتابة.

## 9) المنافذ الافتراضية
- Backend: 3002 (يمكن تعديله بـ BACKEND_PORT)
- Frontend: 3000 (يمكن تغييره في سكربتات npm)
- PostgreSQL: 5432

## 10) مشاكل شائعة وحلول
- منفذ مستخدم (EADDRINUSE):
  - إما أغلق العملية التي تستخدم المنفذ أو غيّر BACKEND_PORT (ثم حدّث REACT_APP_API_URL).
- أخطاء صلاحيات قاعدة البيانات:
  - تحقق من DB_USER/DB_PASSWORD ووجود قاعدة البيانات.
- فشل طلبات الواجهة الأمامية:
  - تأكد من صحة REACT_APP_API_URL والتوافق مع CORS_ORIGIN في الباكند.

## 11) أوامر مفيدة
- تشغيل الهجرات: npm --prefix backend run db:migrate
- تشغيل البذور: npm --prefix backend run db:seed
- تشغيل باكند تطوير: npm --prefix backend run dev
- تشغيل فرونت: npm --prefix frontend run start

بالتوفيق!