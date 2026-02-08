# 🤖 Intelligent Technical Assistant
## نظام المساعد الفني الذكي

نظام ذكي ومتكامل لإدارة صيانة المركبات والأعطال باستخدام **Node.js + TypeScript + PostgreSQL**.

---

## 📊 حالة المشروع

🟢 **جاهز للتطوير** | الإنجاز: **43%** | آخر تحديث: **2026-01-21**

| المكون | الحالة |
|--------|---------|
| البنية الأساسية | ✅ مكتمل |
| قاعدة البيانات | ✅ مكتمل |
| السيرفر | ✅ يعمل |
| Authentication | 🔜 قادم |
| API Endpoints | 🔜 قادم |
| Frontend | 🔜 قادم |

---

## 🚀 البدء السريع

### للمبتدئين
```powershell
# 1. تثبيت المكتبات
npm install

# 2. اختبار الاتصال
node test-connection.js

# 3. تشغيل السيرفر
npm run dev

# 4. افتح المتصفح
http://localhost:3000/health
```

### للمطورين
راجع [QUICK-START.md](QUICK-START.md) للبدء السريع أو [STEP-BY-STEP.md](STEP-BY-STEP.md) للدليل التفصيلي.

---

## 📚 التوثيق الكامل

### 📖 الأدلة الرئيسية

| الملف | الوصف | متى تستخدمه |
|-------|--------|--------------|
| **[DOCUMENTATION-INDEX.md](DOCUMENTATION-INDEX.md)** | 📚 فهرس شامل لجميع الملفات | **ابدأ من هنا!** |
| **[STATUS-REPORT.md](STATUS-REPORT.md)** | ✅ تقرير الحالة الحالية | للحصول على نظرة سريعة |
| **[PROJECT-SUMMARY.md](PROJECT-SUMMARY.md)** | 📋 ملخص شامل للمشروع | لفهم المشروع بالكامل |
| **[NEXT-STEPS.md](NEXT-STEPS.md)** | 🚀 خطة العمل التفصيلية | للبدء في التطوير |
| **[DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md)** | 📚 دليل المطور الشامل | للتفاصيل التقنية |
| **[COMMANDS.md](COMMANDS.md)** | ⚡ مرجع الأوامر السريعة | للأوامر اليومية |

### 🎯 اختر حسب احتياجك

**أريد أن...**
- 🆕 **أبدأ المشروع لأول مرة** → [STEP-BY-STEP.md](STEP-BY-STEP.md)
- ⚡ **أشغل المشروع بسرعة** → [QUICK-START.md](QUICK-START.md)
- 📊 **أعرف حالة المشروع** → [STATUS-REPORT.md](STATUS-REPORT.md)
- 🚀 **أبدأ التطوير** → [NEXT-STEPS.md](NEXT-STEPS.md)
- 🔍 **أفهم التفاصيل التقنية** → [DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md)
- 💻 **أحتاج أوامر سريعة** → [COMMANDS.md](COMMANDS.md)

---

## 🏗️ البنية التقنية

### Backend
- **Node.js** (>=18.0.0) + **TypeScript** (^5.3.3)
- **Express.js** (^4.18.2)
- **PostgreSQL** (14+)
- **JWT** للمصادقة
- **bcrypt** لتشفير كلمات المرور

### قاعدة البيانات
- **4 جداول رئيسية**: users, vehicles, faults, maintenance_tasks
- **3 Views**: للأعطال المفتوحة، الصيانة القادمة، إحصائيات المركبات
- **4 Triggers**: للتحديث التلقائي
- **12 Indexes**: لتحسين الأداء

---

## 📊 قاعدة البيانات

### الجداول الرئيسية

```
┌─────────────┐
│    users    │ (4 سجلات)
└──────┬──────┘
       │
       ├─► reported_by
       │
┌──────▼──────┐      ┌──────────────┐
│   faults    │◄─────┤   vehicles   │
│ (5 سجلات)  │      │  (5 سجلات)  │
└──────┬──────┘      └──────┬───────┘
       │                    │
       │ fault_id           │ vehicle_id
       │                    │
       ▼                    ▼
┌─────────────────────────────┐
│    maintenance_tasks        │
│        (4 سجلات)            │
└─────────────────────────────┘
```

### معلومات الاتصال

```
Host:     localhost
Port:     5432
Database: intelligent_technical_assistant
Username: postgres
Password: 1415
```

---

## 🔐 بيانات تسجيل الدخول

| Employee ID | Password | Role | الاسم |
|-------------|----------|------|-------|
| ADMIN001 | password123 | admin | مدير النظام |
| SUPER001 | password123 | supervisor | المشرف الأول |
| TECH001 | password123 | technician | فني الصيانة الأول |
| TECH002 | password123 | technician | فني الصيانة الثاني |

---

## 🛠️ الأوامر الأساسية

### تشغيل المشروع
```powershell
npm run dev
```

### اختبار الاتصال
```powershell
node test-connection.js
```

### إعادة إنشاء قاعدة البيانات
```powershell
$env:PGPASSWORD="1415"
psql -U postgres -c "DROP DATABASE IF EXISTS intelligent_technical_assistant"
psql -U postgres -c "CREATE DATABASE intelligent_technical_assistant"
psql -U postgres -d intelligent_technical_assistant -f database\schema.sql
```

**للمزيد من الأوامر**: راجع [COMMANDS.md](COMMANDS.md)

---

## 📡 API Endpoints

### الحالية (متاحة الآن)
```
GET  /health      - فحص صحة السيرفر
GET  /api         - معلومات API
```

### القادمة (قيد التطوير)
```
POST /api/auth/login              - تسجيل الدخول
GET  /api/auth/me                 - بيانات المستخدم الحالي
GET  /api/users                   - قائمة المستخدمين
GET  /api/vehicles                - قائمة المركبات
GET  /api/faults                  - قائمة الأعطال
GET  /api/maintenance             - قائمة مهام الصيانة
```

**للتفاصيل الكاملة**: راجع [DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md)

---

## 📁 هيكل المشروع

```
intelligent-technical-assistant/
├── 📚 التوثيق
│   ├── README.md                    # هذا الملف
│   ├── DOCUMENTATION-INDEX.md       # فهرس التوثيق
│   ├── STATUS-REPORT.md            # تقرير الحالة
│   ├── PROJECT-SUMMARY.md          # ملخص المشروع
│   ├── NEXT-STEPS.md               # خطة العمل
│   ├── DEVELOPER-GUIDE.md          # دليل المطور
│   ├── COMMANDS.md                 # مرجع الأوامر
│   ├── STEP-BY-STEP.md            # دليل تفصيلي
│   └── QUICK-START.md             # بدء سريع
│
├── 💻 الكود المصدري
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts        # اتصال PostgreSQL
│   │   └── server.ts              # السيرفر الرئيسي
│   └── database/
│       └── schema.sql             # قاعدة البيانات
│
├── 🛠️ الأدوات
│   ├── test-connection.js         # اختبار الاتصال
│   ├── generate-passwords.js      # توليد كلمات المرور
│   └── check-requirements.bat     # فحص المتطلبات
│
└── ⚙️ الإعدادات
    ├── .env                       # المتغيرات البيئية
    ├── package.json               # المكتبات
    └── tsconfig.json              # إعدادات TypeScript
```

---

## 🎯 الخطوات التالية

### المرحلة 1: Authentication (الأولوية العالية) 🔥
- [ ] إنشاء Password & JWT Utilities
- [ ] إنشاء Auth Controller & Middleware
- [ ] إنشاء Auth Routes
- [ ] تحديث كلمات المرور في قاعدة البيانات
- [ ] الاختبار

**المدة المتوقعة**: 5 ساعات  
**التفاصيل**: راجع [NEXT-STEPS.md](NEXT-STEPS.md) - المرحلة 1

### المرحلة 2: API Development
- [ ] Users API (6 endpoints)
- [ ] Vehicles API (8 endpoints)
- [ ] Faults API (8 endpoints)
- [ ] Maintenance API (9 endpoints)

**المدة المتوقعة**: 7 أيام  
**التفاصيل**: راجع [NEXT-STEPS.md](NEXT-STEPS.md) - المرحلة 2

---

## 🔧 استكشاف الأخطاء

### السيرفر لا يعمل؟
```powershell
# تحقق من المنفذ
netstat -ano | findstr :3000

# أعد تشغيل السيرفر
npm run dev
```

### قاعدة البيانات لا تعمل؟
```powershell
# اختبر الاتصال
node test-connection.js

# تحقق من PostgreSQL
Get-Service -Name "*postgres*"
```

**للمزيد**: راجع [COMMANDS.md](COMMANDS.md) - قسم "استكشاف الأخطاء"

---

## 📞 الدعم والمساعدة

### 📚 ابدأ من هنا
1. **[DOCUMENTATION-INDEX.md](DOCUMENTATION-INDEX.md)** - فهرس شامل لكل شيء
2. **[STATUS-REPORT.md](STATUS-REPORT.md)** - حالة المشروع الحالية
3. **[COMMANDS.md](COMMANDS.md)** - الأوامر السريعة

### 🎯 حسب احتياجك
- **مبتدئ؟** → ابدأ من [STEP-BY-STEP.md](STEP-BY-STEP.md)
- **مطور؟** → راجع [DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md)
- **مشكلة؟** → راجع [COMMANDS.md](COMMANDS.md)

---

## ✨ الميزات

### ✅ متوفرة الآن
- ✅ قاعدة بيانات PostgreSQL كاملة
- ✅ سيرفر Express.js يعمل
- ✅ 18 سجل بيانات تجريبية
- ✅ 3 Views للاستعلامات المعقدة
- ✅ 4 Triggers للتحديث التلقائي
- ✅ توثيق شامل (8 ملفات)

### 🔜 قادمة قريباً
- 🔜 نظام تسجيل الدخول (JWT)
- 🔜 33 API Endpoint
- 🔜 واجهة مستخدم (React)
- 🔜 رفع الملفات
- 🔜 التقارير والإحصائيات

---

## 🎉 جاهز للاستخدام!

المشروع **جاهز 100%** للبدء في التطوير!

### الخطوة التالية الموصى بها:
1. راجع [NEXT-STEPS.md](NEXT-STEPS.md) - المرحلة 1
2. ابدأ ببناء نظام Authentication
3. المدة المتوقعة: 5 ساعات

---

**Built with ❤️ using Node.js + TypeScript + PostgreSQL**

**آخر تحديث**: 2026-01-21 | **الإصدار**: 1.0.0
