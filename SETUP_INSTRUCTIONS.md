# تعليمات إعداد وتشغيل المشروع

## متطلبات النظام

- Docker Desktop
- Docker Compose

## خطوات التثبيت

1. تأكد من تثبيت Docker Desktop وتشغيله على جهازك
   - يمكنك تحميل Docker Desktop من [موقع Docker الرسمي](https://www.docker.com/products/docker-desktop/)
   - بعد التثبيت، قم بتشغيل Docker Desktop وانتظر حتى يبدأ تشغيل المحرك

2. افتح موجه الأوامر (Command Prompt) أو PowerShell كمسؤول

3. انتقل إلى مجلد المشروع:
   ```
   cd "d:\projet\New 1\New 5\New 4\New 2"
   ```

4. قم بتشغيل الخدمات باستخدام Docker Compose:
   ```
   docker-compose up -d
   ```

5. انتظر حتى يتم تشغيل جميع الخدمات (قد يستغرق ذلك بضع دقائق في المرة الأولى)

## الوصول إلى التطبيق

- واجهة المستخدم (Frontend): http://localhost:3005
- واجهة برمجة التطبيقات (API): http://localhost:3001
- واجهة إدارة قاعدة البيانات (pgAdmin): http://localhost:5050

## تسجيل الدخول إلى pgAdmin

1. افتح متصفح الويب وانتقل إلى http://localhost:5050
2. استخدم بيانات الاعتماد التالية للدخول:
   - البريد الإلكتروني: admin@example.com
   - كلمة المرور: admin

3. بعد تسجيل الدخول، أضف خادم جديد:
   - انقر بزر الماوس الأيمن على "Servers" واختر "Create" ثم "Server..."
   - في علامة التبويب "General"، أدخل اسمًا للخادم (مثل "Grocery DB")
   - في علامة التبويب "Connection"، أدخل المعلومات التالية:
     - Host name/address: postgres
     - Port: 5432
     - Maintenance database: postgres
     - Username: postgres
     - Password: postgres
   - انقر على "Save"

4. يمكنك الآن استعراض قاعدة البيانات "grocery_management" والجداول الموجودة فيها

## إضافة وحذف المنتجات

1. تأكد من تشغيل جميع الخدمات باستخدام Docker
2. انتقل إلى واجهة المستخدم على http://localhost:3005
3. سجل الدخول باستخدام حساب المسؤول
4. انتقل إلى صفحة المنتجات
5. يمكنك إضافة منتجات جديدة بالنقر على زر "إضافة منتج"
6. يمكنك حذف المنتجات بالنقر على زر الحذف بجانب المنتج

## استكشاف الأخطاء وإصلاحها

إذا واجهت مشكلة في تشغيل Docker أو الوصول إلى الخدمات:

1. تأكد من تشغيل Docker Desktop
2. تحقق من حالة الخدمات باستخدام الأمر:
   ```
   docker ps
   ```
3. إذا لم تكن الخدمات تعمل، يمكنك إعادة تشغيلها:
   ```
   docker-compose down
   docker-compose up -d
   ```
4. تحقق من سجلات الخدمات لمعرفة أي أخطاء:
   ```
   docker logs grocery-backend
   docker logs grocery-postgres
   docker logs grocery-pgadmin
   ```