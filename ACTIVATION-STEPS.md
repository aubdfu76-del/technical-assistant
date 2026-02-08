# ✅ خطوات تفعيل Gemini AI

## الوضع الحالي:
❌ المفتاح لا يزال بالقيمة الافتراضية: `your-gemini-api-key-here`

## الخطوات المطلوبة:

### 1️⃣ احصل على API Key من Google:
افتح: https://aistudio.google.com/app/apikey
- سجل الدخول بحساب Google
- انقر "Create API Key"
- انسخ المفتاح

### 2️⃣ أضف المفتاح في ملف .env:
افتح ملف `.env` (مفتوح لديك الآن)

**ابحث عن السطر 53:**
```
GEMINI_API_KEY=your-gemini-api-key-here
```

**استبدله بـ:**
```
GEMINI_API_KEY=المفتاح-الذي-نسخته
```

**مثال:**
```
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3️⃣ احفظ الملف:
اضغط `Ctrl+S`

### 4️⃣ تحقق من التفعيل:
شغل في Terminal:
```bash
node check-gemini.js
```

يجب أن ترى:
```
✅ Status: API Key is CONFIGURED
✅ SUCCESS! Gemini responded: مرحباً
```

### 5️⃣ أعد تشغيل الخادم:
في Terminal:
- اضغط `Ctrl+C` لإيقاف الخادم
- ثم: `npm run dev`

### 6️⃣ جرب المساعد الذكي:
1. افتح: http://localhost:5173
2. اذهب إلى "المساعد الذكي"
3. اسأل أي سؤال!

---

## ⚠️ ملاحظات مهمة:

1. **المفتاح يبدأ عادة بـ:** `AIza...`
2. **طول المفتاح:** حوالي 39 حرف
3. **لا تضع مسافات** قبل أو بعد المفتاح
4. **لا تضع علامات تنصيص** حول المفتاح

---

## 🆘 إذا واجهت مشكلة:

شغل هذا الأمر للتحقق:
```bash
node check-gemini.js
```

سيخبرك بالضبط ما المشكلة!
