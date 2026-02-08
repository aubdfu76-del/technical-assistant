# 📚 دليل المطور الشامل
# Intelligent Technical Assistant - Developer Guide

---

## 📖 جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [البنية التقنية](#البنية-التقنية)
3. [قاعدة البيانات](#قاعدة-البيانات)
4. [API Documentation](#api-documentation)
5. [أمثلة الاستخدام](#أمثلة-الاستخدام)
6. [Best Practices](#best-practices)
7. [الأمان](#الأمان)
8. [الأداء](#الأداء)

---

## 🎯 نظرة عامة

### ما هو المشروع؟
**Intelligent Technical Assistant** هو نظام إدارة متكامل للصيانة الفنية يهدف إلى:
- إدارة المركبات والمعدات
- تتبع الأعطال والمشاكل
- جدولة وإدارة مهام الصيانة
- إدارة المستخدمين والصلاحيات
- توليد التقارير والإحصائيات

### الأهداف الرئيسية
1. **الكفاءة**: تسريع عمليات الصيانة
2. **الشفافية**: تتبع كامل لجميع العمليات
3. **التحليل**: إحصائيات وتقارير مفصلة
4. **الأمان**: حماية البيانات والصلاحيات

---

## 🏗️ البنية التقنية

### Backend Stack

#### Node.js + TypeScript
```json
{
  "node": ">=18.0.0",
  "typescript": "^5.3.3"
}
```

**لماذا TypeScript؟**
- Type safety
- Better IDE support
- Easier refactoring
- Self-documenting code

#### Express.js
```typescript
import express from 'express';
const app = express();
```

**Middleware المستخدم:**
- `helmet`: Security headers
- `cors`: Cross-Origin Resource Sharing
- `morgan`: HTTP request logger
- `express.json()`: JSON body parser

#### PostgreSQL
```
Version: 14+
Port: 5432
```

**لماذا PostgreSQL؟**
- Open source
- ACID compliant
- Rich feature set
- Excellent performance
- Strong community

### Frontend Stack (المخطط)

```
React 18 + TypeScript
Vite (Build tool)
React Router (Routing)
TanStack Query (Data fetching)
Zustand (State management)
React Hook Form (Forms)
Zod (Validation)
```

---

## 🗄️ قاعدة البيانات

### Schema Overview

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │
       │ reported_by
       │
┌──────▼──────┐      ┌──────────────┐
│   faults    │◄─────┤   vehicles   │
└──────┬──────┘      └──────┬───────┘
       │                    │
       │ fault_id           │ vehicle_id
       │                    │
       ▼                    ▼
┌─────────────────────────────┐
│    maintenance_tasks        │
└─────────────────────────────┘
```

### الجداول بالتفصيل

#### 1. users (المستخدمين)

**الغرض**: إدارة المستخدمين والصلاحيات

**الحقول**:
```sql
id              SERIAL PRIMARY KEY
employee_id     VARCHAR(50) UNIQUE NOT NULL
full_name       VARCHAR(255) NOT NULL
email           VARCHAR(255) UNIQUE
password_hash   VARCHAR(255) NOT NULL
role            VARCHAR(50) DEFAULT 'technician'
phone           VARCHAR(50)
is_active       BOOLEAN DEFAULT TRUE
last_login      TIMESTAMP
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**الأدوار (Roles)**:
- `admin`: صلاحيات كاملة
- `supervisor`: إدارة ومراقبة
- `technician`: تنفيذ المهام

**Indexes**:
```sql
idx_users_employee_id ON users(employee_id)
idx_users_role ON users(role)
idx_users_email ON users(email)
```

#### 2. vehicles (المركبات)

**الغرض**: إدارة المركبات والمعدات

**الحقول**:
```sql
id                      SERIAL PRIMARY KEY
plate_number            VARCHAR(50) UNIQUE NOT NULL
vehicle_type            VARCHAR(100) NOT NULL
model                   VARCHAR(100)
manufacturer            VARCHAR(100)
year                    INTEGER
vin                     VARCHAR(100)
current_km              INTEGER DEFAULT 0
engine_type             VARCHAR(100)
fuel_type               VARCHAR(50)
status                  VARCHAR(50) DEFAULT 'active'
last_maintenance_date   TIMESTAMP
next_maintenance_km     INTEGER
notes                   TEXT
created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**الحالات (Status)**:
- `active`: قيد التشغيل
- `inactive`: غير نشط
- `maintenance`: تحت الصيانة
- `retired`: خارج الخدمة

**Indexes**:
```sql
idx_vehicles_plate_number ON vehicles(plate_number)
idx_vehicles_status ON vehicles(status)
idx_vehicles_type ON vehicles(vehicle_type)
```

#### 3. faults (الأعطال)

**الغرض**: تسجيل وتتبع الأعطال

**الحقول**:
```sql
id                  SERIAL PRIMARY KEY
vehicle_id          INTEGER NOT NULL REFERENCES vehicles(id)
fault_code          VARCHAR(50)
title               VARCHAR(255) NOT NULL
description         TEXT NOT NULL
severity            VARCHAR(50) DEFAULT 'medium'
status              VARCHAR(50) DEFAULT 'open'
category            VARCHAR(100)
system_affected     VARCHAR(100)
reported_by         INTEGER REFERENCES users(id)
reported_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
resolved_at         TIMESTAMP
resolution_notes    TEXT
created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**مستويات الخطورة (Severity)**:
- `low`: منخفض
- `medium`: متوسط
- `high`: عالي
- `critical`: حرج

**الحالات (Status)**:
- `open`: مفتوح
- `in_progress`: قيد المعالجة
- `resolved`: تم الحل
- `closed`: مغلق

**Indexes**:
```sql
idx_faults_vehicle_id ON faults(vehicle_id)
idx_faults_status ON faults(status)
idx_faults_severity ON faults(severity)
idx_faults_reported_at ON faults(reported_at)
```

#### 4. maintenance_tasks (مهام الصيانة)

**الغرض**: إدارة وجدولة مهام الصيانة

**الحقول**:
```sql
id                  SERIAL PRIMARY KEY
vehicle_id          INTEGER NOT NULL REFERENCES vehicles(id)
fault_id            INTEGER REFERENCES faults(id)
task_type           VARCHAR(100) NOT NULL
title               VARCHAR(255) NOT NULL
description         TEXT
status              VARCHAR(50) DEFAULT 'pending'
priority            VARCHAR(50) DEFAULT 'normal'
assigned_to         INTEGER REFERENCES users(id)
scheduled_date      TIMESTAMP
started_date        TIMESTAMP
completed_date      TIMESTAMP
estimated_hours     DECIMAL(5,2)
actual_hours        DECIMAL(5,2)
cost                DECIMAL(10,2)
parts_used          TEXT
notes               TEXT
created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**الحالات (Status)**:
- `pending`: معلق
- `in_progress`: قيد التنفيذ
- `completed`: مكتمل
- `cancelled`: ملغي

**الأولويات (Priority)**:
- `low`: منخفض
- `normal`: عادي
- `high`: عالي
- `urgent`: عاجل

**Indexes**:
```sql
idx_maintenance_vehicle_id ON maintenance_tasks(vehicle_id)
idx_maintenance_status ON maintenance_tasks(status)
idx_maintenance_assigned_to ON maintenance_tasks(assigned_to)
idx_maintenance_scheduled_date ON maintenance_tasks(scheduled_date)
```

### Views (العروض)

#### vw_open_faults
```sql
CREATE VIEW vw_open_faults AS
SELECT 
    f.id,
    f.fault_code,
    f.title,
    f.severity,
    f.status,
    v.plate_number,
    v.vehicle_type,
    u.full_name AS reported_by_name
FROM faults f
INNER JOIN vehicles v ON f.vehicle_id = v.id
LEFT JOIN users u ON f.reported_by = u.id
WHERE f.status IN ('open', 'in_progress');
```

#### vw_upcoming_maintenance
```sql
CREATE VIEW vw_upcoming_maintenance AS
SELECT 
    m.id,
    m.title,
    m.task_type,
    m.status,
    m.priority,
    m.scheduled_date,
    v.plate_number,
    u.full_name AS assigned_to_name
FROM maintenance_tasks m
INNER JOIN vehicles v ON m.vehicle_id = v.id
LEFT JOIN users u ON m.assigned_to = u.id
WHERE m.status IN ('pending', 'in_progress')
AND m.scheduled_date >= CURRENT_TIMESTAMP;
```

#### vw_vehicle_stats
```sql
CREATE VIEW vw_vehicle_stats AS
SELECT 
    v.id,
    v.plate_number,
    v.vehicle_type,
    v.status,
    COUNT(DISTINCT f.id) AS total_faults,
    COUNT(DISTINCT CASE WHEN f.status IN ('open', 'in_progress') THEN f.id END) AS open_faults,
    COUNT(DISTINCT m.id) AS total_maintenance_tasks,
    COALESCE(SUM(m.cost), 0) AS total_maintenance_cost
FROM vehicles v
LEFT JOIN faults f ON v.id = f.vehicle_id
LEFT JOIN maintenance_tasks m ON v.id = m.vehicle_id
GROUP BY v.id;
```

### Triggers (المشغلات)

#### Auto-update updated_at
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Similar triggers for other tables
```

---

## 🔌 API Documentation

### Authentication

#### POST /api/auth/login
تسجيل الدخول

**Request**:
```json
{
  "employee_id": "ADMIN001",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "employee_id": "ADMIN001",
      "full_name": "مدير النظام",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

#### GET /api/auth/me
الحصول على بيانات المستخدم الحالي

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "employee_id": "ADMIN001",
    "full_name": "مدير النظام",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Users API (مخطط)

```
GET    /api/users              - قائمة المستخدمين
GET    /api/users/:id          - تفاصيل مستخدم
POST   /api/users              - إضافة مستخدم
PUT    /api/users/:id          - تحديث مستخدم
DELETE /api/users/:id          - حذف مستخدم
PATCH  /api/users/:id/status   - تفعيل/تعطيل
```

### Vehicles API (مخطط)

```
GET    /api/vehicles                   - قائمة المركبات
GET    /api/vehicles/:id               - تفاصيل مركبة
POST   /api/vehicles                   - إضافة مركبة
PUT    /api/vehicles/:id               - تحديث مركبة
DELETE /api/vehicles/:id               - حذف مركبة
GET    /api/vehicles/:id/faults        - أعطال مركبة
GET    /api/vehicles/:id/maintenance   - صيانة مركبة
GET    /api/vehicles/:id/stats         - إحصائيات مركبة
```

---

## 💡 أمثلة الاستخدام

### مثال 1: إنشاء مستخدم جديد

```typescript
// Controller
export const createUser = async (req: Request, res: Response) => {
  try {
    const { employee_id, full_name, email, password, role, phone } = req.body;

    // Validate input
    if (!employee_id || !full_name || !password) {
      return res.status(400).json({
        success: false,
        message: 'البيانات المطلوبة ناقصة',
      });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Insert user
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO users (employee_id, full_name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, employee_id, full_name, email, role, phone, created_at`,
      [employee_id, full_name, email, password_hash, role || 'technician', phone]
    );

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      data: result.rows[0],
    });
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        message: 'رقم الموظف أو البريد الإلكتروني مستخدم بالفعل',
      });
    }
    
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء المستخدم',
    });
  }
};
```

### مثال 2: تسجيل عطل جديد

```typescript
export const createFault = async (req: Request, res: Response) => {
  try {
    const {
      vehicle_id,
      fault_code,
      title,
      description,
      severity,
      category,
      system_affected,
    } = req.body;

    const reported_by = (req as any).user.userId;

    // Validate
    if (!vehicle_id || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'البيانات المطلوبة ناقصة',
      });
    }

    // Check if vehicle exists
    const pool = getPool();
    const vehicleCheck = await pool.query(
      'SELECT id FROM vehicles WHERE id = $1',
      [vehicle_id]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المركبة غير موجودة',
      });
    }

    // Insert fault
    const result = await pool.query(
      `INSERT INTO faults 
       (vehicle_id, fault_code, title, description, severity, category, system_affected, reported_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [vehicle_id, fault_code, title, description, severity || 'medium', category, system_affected, reported_by]
    );

    res.status(201).json({
      success: true,
      message: 'تم تسجيل العطل بنجاح',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create fault error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل العطل',
    });
  }
};
```

---

## ✨ Best Practices

### 1. Error Handling

```typescript
// ❌ سيء
app.get('/api/users', async (req, res) => {
  const users = await pool.query('SELECT * FROM users');
  res.json(users.rows);
});

// ✅ جيد
app.get('/api/users', async (req, res) => {
  try {
    const users = await pool.query('SELECT * FROM users');
    res.json({
      success: true,
      data: users.rows,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المستخدمين',
    });
  }
});
```

### 2. Input Validation

```typescript
import { body, validationResult } from 'express-validator';

// Validation middleware
export const validateUser = [
  body('employee_id')
    .trim()
    .notEmpty()
    .withMessage('رقم الموظف مطلوب'),
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('الاسم الكامل مطلوب'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('البريد الإلكتروني غير صحيح'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
];

// Use in route
router.post('/users', validateUser, createUser);
```

### 3. SQL Injection Prevention

```typescript
// ❌ سيء - عرضة لـ SQL Injection
const userId = req.params.id;
const query = `SELECT * FROM users WHERE id = ${userId}`;
const result = await pool.query(query);

// ✅ جيد - استخدام Parameterized Queries
const userId = req.params.id;
const result = await pool.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);
```

### 4. Password Security

```typescript
import bcrypt from 'bcrypt';

// Hash password
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
```

---

## 🔒 الأمان

### 1. JWT Authentication

```typescript
// Generate token
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET!,
  { expiresIn: '24h' }
);

// Verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET!);
```

### 2. CORS Configuration

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
```

### 3. Helmet Security Headers

```typescript
import helmet from 'helmet';
app.use(helmet());
```

### 4. Rate Limiting (مخطط)

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## ⚡ الأداء

### 1. Database Indexes

```sql
-- Already created in schema.sql
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_faults_vehicle_id ON faults(vehicle_id);
-- etc.
```

### 2. Connection Pooling

```typescript
const pool = new Pool({
  max: 20, // maximum number of clients
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 3. Pagination

```typescript
export const getUsers = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  const result = await pool.query(
    'SELECT * FROM users ORDER BY id LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  const countResult = await pool.query('SELECT COUNT(*) FROM users');
  const total = parseInt(countResult.rows[0].count);

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
};
```

---

## 📝 الخلاصة

هذا الدليل يغطي الأساسيات والمفاهيم المهمة للمشروع. للمزيد من التفاصيل:

- راجع `PROJECT-SUMMARY.md` للملخص الشامل
- راجع `NEXT-STEPS.md` لخطة العمل التفصيلية
- راجع `COMMANDS.md` للأوامر السريعة

**Happy Coding! 🚀**

---

**آخر تحديث**: 2026-01-21
**الإصدار**: 1.0.0
