# ⚡ مرجع سريع - الأوامر المهمة
# Intelligent Technical Assistant

---

## 🚀 تشغيل المشروع

### تشغيل السيرفر (Development)
```powershell
cd "c:\Users\Pc\Desktop\intelligent technical assostant"
npm run dev
```

### تشغيل السيرفر (Production)
```powershell
npm run build
npm start
```

---

## 🔍 اختبار الاتصال

### اختبار قاعدة البيانات
```powershell
node test-connection.js
```

### اختبار السيرفر
```powershell
# في المتصفح
http://localhost:3000/health
```

---

## 🗄️ إدارة قاعدة البيانات

### الاتصال بـ PostgreSQL
```powershell
$env:PGPASSWORD="1415"
psql -U postgres
```

### الاتصال بقاعدة البيانات المحددة
```powershell
$env:PGPASSWORD="1415"
psql -U postgres -d intelligent_technical_assistant
```

### عرض جميع قواعد البيانات
```powershell
$env:PGPASSWORD="1415"
psql -U postgres -c "\l"
```

### عرض جميع الجداول
```powershell
$env:PGPASSWORD="1415"
psql -U postgres -d intelligent_technical_assistant -c "\dt"
```

### عرض بيانات جدول
```powershell
# المستخدمين
$env:PGPASSWORD="1415"
psql -U postgres -d intelligent_technical_assistant -c "SELECT * FROM users;"

# المركبات
$env:PGPASSWORD="1415"
psql -U postgres -d intelligent_technical_assistant -c "SELECT * FROM vehicles;"

# الأعطال
$env:PGPASSWORD="1415"
psql -U postgres -d intelligent_technical_assistant -c "SELECT * FROM faults;"

# مهام الصيانة
$env:PGPASSWORD="1415"
psql -U postgres -d intelligent_technical_assistant -c "SELECT * FROM maintenance_tasks;"
```

### إعادة إنشاء قاعدة البيانات
```powershell
$env:PGPASSWORD="1415"
psql -U postgres -c "DROP DATABASE IF EXISTS intelligent_technical_assistant"
psql -U postgres -c "CREATE DATABASE intelligent_technical_assistant"
psql -U postgres -d intelligent_technical_assistant -f database\schema.sql
```

### تحديث كلمات المرور
```powershell
# 1. توليد الـ hashes
node generate-passwords.js

# 2. نسخ الأوامر SQL وتنفيذها
$env:PGPASSWORD="1415"
psql -U postgres -d intelligent_technical_assistant
# ثم الصق الأوامر SQL
```

---

## 📦 إدارة الحزم

### تثبيت جميع الحزم
```powershell
npm install
```

### تثبيت حزمة جديدة
```powershell
# Production dependency
npm install package-name

# Development dependency
npm install -D package-name
```

### تحديث الحزم
```powershell
npm update
```

### فحص الحزم القديمة
```powershell
npm outdated
```

---

## 🧪 الاختبار

### اختبار API باستخدام curl

#### Health Check
```powershell
curl http://localhost:3000/health
```

#### API Info
```powershell
curl http://localhost:3000/api
```

#### Login (بعد إنشاء Auth API)
```powershell
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"employee_id\":\"ADMIN001\",\"password\":\"password123\"}'
```

---

## 🔧 استكشاف الأخطاء

### السيرفر لا يعمل

#### 1. تحقق من المنفذ
```powershell
# فحص إذا كان المنفذ 3000 مستخدم
netstat -ano | findstr :3000

# إيقاف العملية (استبدل PID برقم العملية)
taskkill /PID <PID> /F
```

#### 2. تحقق من PostgreSQL
```powershell
# فحص حالة PostgreSQL
pg_ctl status

# تشغيل PostgreSQL
pg_ctl start

# إيقاف PostgreSQL
pg_ctl stop
```

#### 3. تحقق من المتغيرات البيئية
```powershell
# عرض محتوى .env
cat .env
```

### قاعدة البيانات لا تعمل

#### 1. تحقق من الاتصال
```powershell
node test-connection.js
```

#### 2. تحقق من كلمة المرور
```powershell
# في ملف .env
DB_PASSWORD=1415
```

#### 3. إعادة إنشاء قاعدة البيانات
```powershell
$env:PGPASSWORD="1415"
psql -U postgres -f database\schema.sql
```

### خطأ في الحزم

#### 1. حذف node_modules
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
```

#### 2. إعادة التثبيت
```powershell
npm install
```

---

## 📊 استعلامات مفيدة

### عدد السجلات في كل جدول
```sql
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 
    'vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 
    'faults', COUNT(*) FROM faults
UNION ALL
SELECT 
    'maintenance_tasks', COUNT(*) FROM maintenance_tasks;
```

### الأعطال المفتوحة
```sql
SELECT * FROM vw_open_faults;
```

### مهام الصيانة القادمة
```sql
SELECT * FROM vw_upcoming_maintenance;
```

### إحصائيات المركبات
```sql
SELECT * FROM vw_vehicle_stats;
```

### آخر 10 أعطال
```sql
SELECT 
    f.fault_code,
    f.title,
    f.severity,
    f.status,
    v.plate_number,
    u.full_name as reported_by,
    f.reported_at
FROM faults f
JOIN vehicles v ON f.vehicle_id = v.id
LEFT JOIN users u ON f.reported_by = u.id
ORDER BY f.reported_at DESC
LIMIT 10;
```

---

## 🔐 بيانات الدخول

### المستخدمين الافتراضيين
```
Employee ID: ADMIN001
Password: password123
Role: admin

Employee ID: SUPER001
Password: password123
Role: supervisor

Employee ID: TECH001
Password: password123
Role: technician

Employee ID: TECH002
Password: password123
Role: technician
```

---

## 🌐 الروابط المهمة

### Backend
- Health Check: http://localhost:3000/health
- API Info: http://localhost:3000/api
- API Docs: http://localhost:3000/api-docs (بعد إضافة Swagger)

### Frontend (بعد الإنشاء)
- Development: http://localhost:5173
- Production: http://localhost:4173

---

## 📝 ملاحظات سريعة

### معلومات قاعدة البيانات
```
Host: localhost
Port: 5432
Database: intelligent_technical_assistant
Username: postgres
Password: 1415
```

### معلومات السيرفر
```
Port: 3000
Environment: development
JWT Secret: intelligent-technical-assistant-secret-key-2026
JWT Expires: 24h
CORS Origin: http://localhost:5173
```

---

## 🚨 أوامر الطوارئ

### إعادة تشغيل كل شيء
```powershell
# 1. إيقاف السيرفر (Ctrl+C)

# 2. إعادة تشغيل PostgreSQL
pg_ctl restart

# 3. إعادة إنشاء قاعدة البيانات
$env:PGPASSWORD="1415"
psql -U postgres -c "DROP DATABASE IF EXISTS intelligent_technical_assistant"
psql -U postgres -c "CREATE DATABASE intelligent_technical_assistant"
psql -U postgres -d intelligent_technical_assistant -f database\schema.sql

# 4. تشغيل السيرفر
npm run dev
```

### نسخ احتياطي لقاعدة البيانات
```powershell
$env:PGPASSWORD="1415"
pg_dump -U postgres -d intelligent_technical_assistant -f backup.sql
```

### استعادة من نسخة احتياطية
```powershell
$env:PGPASSWORD="1415"
psql -U postgres -d intelligent_technical_assistant -f backup.sql
```

---

## 📚 مراجع إضافية

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**آخر تحديث**: 2026-01-21
**الإصدار**: 1.0.0
