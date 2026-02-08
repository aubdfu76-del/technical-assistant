# 🎯 دليل التنفيذ خطوة بخطوة - PostgreSQL

## ✅ الخطوة 1: البنية الأساسية (مكتملة)
تم إنشاء جميع الملفات المطلوبة ✓
تم تحديث المشروع ليعمل مع PostgreSQL ✓

---

## 📦 الخطوة 2: تثبيت المكتبات (مكتملة)

تم تثبيت 323 حزمة ✓

---

## 🗄️ الخطوة 3: إنشاء قاعدة البيانات

### 3.1 إنشاء قاعدة البيانات

افتح PowerShell وشغل:

```powershell
# الاتصال بـ PostgreSQL
psql -U postgres

# إنشاء قاعدة البيانات
CREATE DATABASE intelligent_technical_assistant;

# الخروج
\q
```

**كلمة المرور:** `1415` (من ملف .env)

---

### 3.2 تنفيذ سكريبت قاعدة البيانات

```powershell
cd "c:\Users\Pc\Desktop\intelligent technical assostant"

# تنفيذ السكريبت
psql -U postgres -d intelligent_technical_assistant -f database\schema.sql
```

**✅ علامة النجاح:** رؤية رسالة:
```
✅ تم إنشاء قاعدة البيانات بنجاح!
```

---

## 🧪 الخطوة 4: اختبار الاتصال

```powershell
cd "c:\Users\Pc\Desktop\intelligent technical assostant"
node test-connection.js
```

**✅ إذا نجح، ستشوف:**
```
✅ تم الاتصال بنجاح!
📋 عدد الجداول: 4
📝 الجداول الموجودة:
  ✓ users
  ✓ vehicles
  ✓ faults
  ✓ maintenance_tasks
👥 عدد المستخدمين: 4
🚛 عدد المركبات: 5
⚠️  عدد الأعطال: 5
✅ الاتصال يعمل بشكل ممتاز!
```

---

## 🚀 الخطوة 5: تشغيل السيرفر

```powershell
npm run dev
```

**✅ علامة النجاح:**
```
🔄 Connecting to PostgreSQL...
✅ Connected to PostgreSQL database: intelligent_technical_assistant

═══════════════════════════════════════════════════════
🚀 Intelligent Technical Assistant API
═══════════════════════════════════════════════════════
📡 Server:      http://localhost:3000
📊 Database:    PostgreSQL
🌍 Environment: development
```

---

## 🌐 الخطوة 6: اختبار API

### افتح المتصفح على:
```
http://localhost:3000/health
```

**✅ يجب أن ترى:**
```json
{
  "status": "OK",
  "message": "Intelligent Technical Assistant API is running",
  "database": "PostgreSQL",
  "timestamp": "2026-01-21T..."
}
```

---

## 📋 قائمة التحقق النهائية

- [x] تم إنشاء الملفات
- [x] تم تثبيت المكتبات
- [ ] تم إنشاء قاعدة البيانات
- [ ] تم تنفيذ schema.sql
- [ ] اختبار الاتصال نجح
- [ ] السيرفر يعمل
- [ ] /health يعمل في المتصفح

---

## 🆘 حل المشاكل

### مشكلة: قاعدة البيانات موجودة مسبقاً

```powershell
# حذف وإعادة إنشاء
psql -U postgres -c "DROP DATABASE IF EXISTS intelligent_technical_assistant;"
psql -U postgres -c "CREATE DATABASE intelligent_technical_assistant;"
psql -U postgres -d intelligent_technical_assistant -f database\schema.sql
```

### مشكلة: PostgreSQL لا يعمل

```powershell
# التحقق من الخدمة
Get-Service -Name "*postgres*"

# إذا كانت متوقفة، شغلها
Start-Service postgresql-x64-*
```

### مشكلة: خطأ في كلمة المرور

- تأكد من كلمة المرور في `.env`
- كلمة المرور الافتراضية: `1415`

---

## 🎯 الخطوة الحالية

**أنت الآن في الخطوة 3: إنشاء قاعدة البيانات**

قم بتنفيذ:

```powershell
# 1. إنشاء قاعدة البيانات
psql -U postgres -c "CREATE DATABASE intelligent_technical_assistant;"

# 2. تنفيذ السكريبت
cd "c:\Users\Pc\Desktop\intelligent technical assostant"
psql -U postgres -d intelligent_technical_assistant -f database\schema.sql

# 3. اختبار الاتصال
node test-connection.js
```

**ثم أخبرني بالنتيجة!** 🚀
