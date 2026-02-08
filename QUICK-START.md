# ⚡ دليل البدء السريع

## الخطوات (5 دقائق فقط!)

### 1️⃣ تثبيت المكتبات
```bash
cd "c:\Users\Pc\Desktop\intelligent technical assostant"
npm install
```

### 2️⃣ إنشاء قاعدة البيانات
- افتح **SSMS**
- افتح ملف: `database/schema.sql`
- اضغط **F5**

### 3️⃣ تعديل كلمة المرور
افتح `.env` وعدّل:
```env
DB_PASSWORD=كلمة_المرور_الخاصة_بك
```

### 4️⃣ تشغيل السيرفر
```bash
npm run dev
```

### 5️⃣ اختبار
افتح: http://localhost:3000/health

---

## ✅ إذا رأيت هذا، كل شيء يعمل!

```json
{
  "status": "OK",
  "message": "Intelligent Technical Assistant API is running",
  "database": "SQL Server"
}
```

---

**جاهز! 🎉**
