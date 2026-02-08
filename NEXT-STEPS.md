# 🚀 خطة العمل التفصيلية - الخطوات التالية
# Intelligent Technical Assistant

---

## 📋 جدول المحتويات
1. [المرحلة الحالية](#المرحلة-الحالية)
2. [المرحلة 1: Authentication](#المرحلة-1-authentication--authorization)
3. [المرحلة 2: API Development](#المرحلة-2-api-development)
4. [المرحلة 3: Frontend](#المرحلة-3-frontend-development)
5. [المرحلة 4: Advanced Features](#المرحلة-4-advanced-features)
6. [المرحلة 5: Production](#المرحلة-5-production-ready)

---

## ✅ المرحلة الحالية

### ما تم إنجازه
- [x] إعداد Node.js + TypeScript + Express
- [x] إعداد PostgreSQL
- [x] إنشاء قاعدة البيانات والجداول
- [x] إدراج البيانات التجريبية
- [x] إعداد السيرفر الأساسي
- [x] اختبار الاتصال بقاعدة البيانات

### الحالة الحالية
🟢 **جاهز للانتقال للمرحلة التالية**

---

## 🔐 المرحلة 1: Authentication & Authorization

### الهدف
بناء نظام تسجيل دخول آمن مع إدارة الصلاحيات

### المدة المتوقعة
⏱️ 2-3 أيام

### الخطوات التفصيلية

#### 1.1 إنشاء هيكل المجلدات
```powershell
# في مجلد src
mkdir routes
mkdir controllers
mkdir middleware
mkdir utils
mkdir types
```

الهيكل المطلوب:
```
src/
├── config/
│   └── database.ts
├── routes/
│   └── auth.routes.ts
├── controllers/
│   └── auth.controller.ts
├── middleware/
│   ├── auth.middleware.ts
│   └── validation.middleware.ts
├── utils/
│   ├── jwt.util.ts
│   └── password.util.ts
├── types/
│   └── express.d.ts
└── server.ts
```

#### 1.2 إنشاء Password Utilities
**الملف**: `src/utils/password.util.ts`

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
```

#### 1.3 إنشاء JWT Utilities
**الملف**: `src/utils/jwt.util.ts`

```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JwtPayload {
  userId: number;
  employeeId: string;
  role: string;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
```

#### 1.4 إنشاء Auth Controller
**الملف**: `src/controllers/auth.controller.ts`

```typescript
import { Request, Response } from 'express';
import { getPool } from '../config/database';
import { comparePassword } from '../utils/password.util';
import { generateToken } from '../utils/jwt.util';

export const login = async (req: Request, res: Response) => {
  try {
    const { employee_id, password } = req.body;

    // Validate input
    if (!employee_id || !password) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال رقم الموظف وكلمة المرور',
      });
    }

    // Get user from database
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE employee_id = $1 AND is_active = true',
      [employee_id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'رقم الموظف أو كلمة المرور غير صحيحة',
      });
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'رقم الموظف أو كلمة المرور غير صحيحة',
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      employeeId: user.employee_id,
      role: user.role,
    });

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Return success response
    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        token,
        user: {
          id: user.id,
          employee_id: user.employee_id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل الدخول',
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  // In JWT, logout is handled on client side by removing the token
  res.json({
    success: true,
    message: 'تم تسجيل الخروج بنجاح',
  });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, employee_id, full_name, email, role, phone FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب بيانات المستخدم',
    });
  }
};
```

#### 1.5 إنشاء Auth Middleware
**الملف**: `src/middleware/auth.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'يرجى تسجيل الدخول أولاً',
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'الجلسة منتهية، يرجى تسجيل الدخول مرة أخرى',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user.role;

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية للوصول إلى هذا المورد',
      });
    }

    next();
  };
};
```

#### 1.6 إنشاء Auth Routes
**الملف**: `src/routes/auth.routes.ts`

```typescript
import express from 'express';
import { login, logout, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/login', login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);

export default router;
```

#### 1.7 تحديث Server.ts
**في**: `src/server.ts`

أضف هذه الأسطر بعد الـ middleware:
```typescript
import authRoutes from './routes/auth.routes';

// Auth routes
app.use('/api/auth', authRoutes);
```

#### 1.8 تحديث كلمات المرور في قاعدة البيانات
**ملف**: `database/update-passwords.sql`

```sql
-- Update passwords with proper bcrypt hashes
-- Password: password123

UPDATE users SET password_hash = '$2b$10$YourActualBcryptHashHere' WHERE employee_id = 'ADMIN001';
UPDATE users SET password_hash = '$2b$10$YourActualBcryptHashHere' WHERE employee_id = 'SUPER001';
UPDATE users SET password_hash = '$2b$10$YourActualBcryptHashHere' WHERE employee_id = 'TECH001';
UPDATE users SET password_hash = '$2b$10$YourActualBcryptHashHere' WHERE employee_id = 'TECH002';
```

#### 1.9 اختبار الـ API

**باستخدام curl**:
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"employee_id":"ADMIN001","password":"password123"}'

# Get current user (استخدم الـ token من الاستجابة السابقة)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**باستخدام Postman**:
1. أنشئ Collection جديد
2. أضف Request للـ Login
3. احفظ الـ Token في Environment Variable
4. اختبر باقي الـ Endpoints

### ✅ معايير الإنجاز للمرحلة 1
- [ ] يمكن تسجيل الدخول بنجاح
- [ ] يتم إنشاء JWT Token
- [ ] يمكن الوصول للـ Protected Routes
- [ ] يتم رفض الوصول بدون Token
- [ ] يعمل نظام الصلاحيات (Roles)
- [ ] كلمات المرور مشفرة بـ bcrypt

---

## 📡 المرحلة 2: API Development

### الهدف
بناء جميع الـ API Endpoints للنظام

### المدة المتوقعة
⏱️ 5-7 أيام

### 2.1 Users API

#### الملفات المطلوبة
- `src/controllers/users.controller.ts`
- `src/routes/users.routes.ts`
- `src/middleware/validation.middleware.ts`

#### Endpoints
```
GET    /api/users           - قائمة المستخدمين (admin, supervisor)
GET    /api/users/:id       - تفاصيل مستخدم (admin, supervisor)
POST   /api/users           - إضافة مستخدم (admin only)
PUT    /api/users/:id       - تحديث مستخدم (admin only)
DELETE /api/users/:id       - حذف مستخدم (admin only)
PATCH  /api/users/:id/status - تفعيل/تعطيل (admin only)
```

### 2.2 Vehicles API

#### الملفات المطلوبة
- `src/controllers/vehicles.controller.ts`
- `src/routes/vehicles.routes.ts`

#### Endpoints
```
GET    /api/vehicles              - قائمة المركبات
GET    /api/vehicles/:id          - تفاصيل مركبة
POST   /api/vehicles              - إضافة مركبة (admin, supervisor)
PUT    /api/vehicles/:id          - تحديث مركبة (admin, supervisor)
DELETE /api/vehicles/:id          - حذف مركبة (admin only)
GET    /api/vehicles/:id/faults   - أعطال مركبة
GET    /api/vehicles/:id/maintenance - صيانة مركبة
GET    /api/vehicles/:id/stats    - إحصائيات مركبة
```

### 2.3 Faults API

#### الملفات المطلوبة
- `src/controllers/faults.controller.ts`
- `src/routes/faults.routes.ts`

#### Endpoints
```
GET    /api/faults              - قائمة الأعطال
GET    /api/faults/:id          - تفاصيل عطل
POST   /api/faults              - تسجيل عطل
PUT    /api/faults/:id          - تحديث عطل
DELETE /api/faults/:id          - حذف عطل (admin only)
PATCH  /api/faults/:id/status   - تحديث حالة
POST   /api/faults/:id/resolve  - حل العطل
GET    /api/faults/open         - الأعطال المفتوحة
```

### 2.4 Maintenance API

#### الملفات المطلوبة
- `src/controllers/maintenance.controller.ts`
- `src/routes/maintenance.routes.ts`

#### Endpoints
```
GET    /api/maintenance                - قائمة المهام
GET    /api/maintenance/:id            - تفاصيل مهمة
POST   /api/maintenance                - إنشاء مهمة
PUT    /api/maintenance/:id            - تحديث مهمة
DELETE /api/maintenance/:id            - حذف مهمة (admin only)
PATCH  /api/maintenance/:id/status     - تحديث حالة
POST   /api/maintenance/:id/start      - بدء المهمة
POST   /api/maintenance/:id/complete   - إكمال المهمة
GET    /api/maintenance/upcoming       - المهام القادمة
```

### 2.5 Dashboard API

#### الملفات المطلوبة
- `src/controllers/dashboard.controller.ts`
- `src/routes/dashboard.routes.ts`

#### Endpoints
```
GET /api/dashboard/stats     - إحصائيات عامة
GET /api/dashboard/charts    - بيانات الرسوم البيانية
```

### ✅ معايير الإنجاز للمرحلة 2
- [ ] جميع الـ CRUD operations تعمل
- [ ] Validation للبيانات المدخلة
- [ ] Error handling مناسب
- [ ] Pagination للقوائم الطويلة
- [ ] Search & Filter
- [ ] Sorting
- [ ] توثيق الـ API

---

## 🎨 المرحلة 3: Frontend Development

### الهدف
بناء واجهة مستخدم حديثة وسهلة الاستخدام

### المدة المتوقعة
⏱️ 10-14 يوم

### 3.1 اختيار Framework

**الخيارات**:
1. **React + Vite** (موصى به)
2. **Next.js** (للتطبيقات الأكبر)
3. **Vue.js**

**القرار**: React + Vite

### 3.2 إنشاء المشروع

```powershell
# في مجلد المشروع الرئيسي
cd "c:\Users\Pc\Desktop\intelligent technical assostant"

# إنشاء مشروع frontend
npm create vite@latest frontend -- --template react-ts

# الانتقال للمجلد
cd frontend

# تثبيت المكتبات
npm install

# تثبيت مكتبات إضافية
npm install react-router-dom axios @tanstack/react-query
npm install -D @types/react-router-dom
```

### 3.3 المكتبات المطلوبة

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.2",
    "@tanstack/react-query": "^5.12.0",
    "zustand": "^4.4.7",
    "react-hook-form": "^7.48.2",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.2",
    "date-fns": "^2.30.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0"
  }
}
```

### 3.4 هيكل المشروع

```
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Table.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   └── features/
│   │       ├── auth/
│   │       ├── users/
│   │       ├── vehicles/
│   │       ├── faults/
│   │       └── maintenance/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Users.tsx
│   │   ├── Vehicles.tsx
│   │   ├── Faults.tsx
│   │   └── Maintenance.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── users.service.ts
│   │   ├── vehicles.service.ts
│   │   ├── faults.service.ts
│   │   └── maintenance.service.ts
│   ├── store/
│   │   └── authStore.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── helpers.ts
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 3.5 الصفحات المطلوبة

1. **صفحة تسجيل الدخول**
   - Form لإدخال البيانات
   - Validation
   - Error handling
   - RTL support

2. **Dashboard**
   - إحصائيات عامة
   - رسوم بيانية
   - آخر الأعطال
   - المهام القادمة

3. **إدارة المستخدمين**
   - قائمة المستخدمين
   - إضافة/تعديل/حذف
   - Search & Filter
   - Pagination

4. **إدارة المركبات**
   - قائمة المركبات
   - تفاصيل المركبة
   - إضافة/تعديل/حذف
   - تاريخ الصيانة

5. **إدارة الأعطال**
   - قائمة الأعطال
   - تسجيل عطل جديد
   - تحديث حالة العطل
   - حل العطل

6. **إدارة الصيانة**
   - قائمة المهام
   - إنشاء مهمة جديدة
   - تتبع المهام
   - إكمال المهام

### 3.6 التصميم

**الألوان**:
```css
:root {
  --primary: #2563eb;
  --secondary: #64748b;
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;
  --dark: #1e293b;
  --light: #f8fafc;
}
```

**الخطوط**:
- العربية: Cairo, Tajawal
- الإنجليزية: Inter, Roboto

### ✅ معايير الإنجاز للمرحلة 3
- [ ] جميع الصفحات تعمل
- [ ] RTL support كامل
- [ ] Responsive design
- [ ] Dark/Light mode
- [ ] Loading states
- [ ] Error handling
- [ ] Form validation
- [ ] User-friendly UI

---

## 🚀 المرحلة 4: Advanced Features

### المدة المتوقعة
⏱️ 7-10 أيام

### 4.1 File Upload
- رفع صور المركبات
- رفع مستندات الصيانة
- معاينة الملفات

### 4.2 Notifications
- إشعارات في الوقت الفعلي
- إشعارات البريد الإلكتروني
- إشعارات SMS

### 4.3 Reports
- تقرير الأعطال
- تقرير الصيانة
- تقرير التكاليف
- Export to PDF/Excel

### 4.4 Advanced Search
- بحث متقدم
- فلاتر متعددة
- حفظ البحث

### 4.5 Data Visualization
- رسوم بيانية تفاعلية
- Dashboard متقدم
- تحليلات

---

## 🌐 المرحلة 5: Production Ready

### المدة المتوقعة
⏱️ 3-5 أيام

### 5.1 Testing
- Unit tests
- Integration tests
- E2E tests

### 5.2 Documentation
- API documentation (Swagger)
- User manual
- Developer guide

### 5.3 Deployment
- Docker configuration
- CI/CD pipeline
- Production build

### 5.4 Security
- Security audit
- Penetration testing
- SSL/TLS

---

## 📊 الجدول الزمني الإجمالي

| المرحلة | المدة | البداية | النهاية |
|---------|-------|----------|----------|
| 1. Authentication | 2-3 أيام | - | - |
| 2. API Development | 5-7 أيام | - | - |
| 3. Frontend | 10-14 يوم | - | - |
| 4. Advanced Features | 7-10 أيام | - | - |
| 5. Production | 3-5 أيام | - | - |
| **المجموع** | **27-39 يوم** | - | - |

---

## 🎯 الأولويات

### أولوية عالية (High Priority)
1. ✅ Authentication System
2. ✅ Users API
3. ✅ Vehicles API
4. ✅ Faults API
5. ✅ Basic Frontend

### أولوية متوسطة (Medium Priority)
1. Maintenance API
2. Dashboard
3. Reports
4. File Upload

### أولوية منخفضة (Low Priority)
1. Notifications
2. Advanced Search
3. Data Visualization
4. Mobile App

---

## 📝 ملاحظات

- يمكن تنفيذ المراحل بشكل متوازي في بعض الأحيان
- التركيز على MVP (Minimum Viable Product) أولاً
- Testing مستمر في كل مرحلة
- Documentation مستمر

---

**آخر تحديث**: 2026-01-21
**الحالة**: 🟢 جاهز للبدء في المرحلة 1
