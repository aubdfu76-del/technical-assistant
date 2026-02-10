import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { initializePool, closePool, getPool } from './config/database';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import vehiclesRoutes from './routes/vehicles.routes';
import faultsRoutes from './routes/faults.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import dashboardRoutes from './routes/dashboard.routes';
import diagnosisRoutes from './routes/diagnosis.routes';
import systemsRoutes from './routes/systems.routes';
import repairRoutes from './routes/repair.routes';
import uploadRoutes from './routes/upload.routes';
import aiRoutes from './routes/ai.routes';
import unitsRoutes from './routes/units.routes';
import { hashPassword, comparePassword } from './utils/password.util';

// Load environment variables only in development
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

console.log('🔄 Server Restarting... (Full Setup Mode)');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// SETUP & DEBUG ROUTE (COMBINED)
// ============================================
app.get('/setup-db-force', async (req: Request, res: Response) => {
    try {
        const pool = getPool();
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const simplePass = '123123';
        const newHash = await hashPassword(simplePass);

        let statusLog = [];

        // 1. Run Schema if needed (or force run it)
        statusLog.push("Checking Schema...");
        if (fs.existsSync(schemaPath) || fs.existsSync(path.join(__dirname, '../../database/schema.sql'))) {
            const actualPath = fs.existsSync(schemaPath) ? schemaPath : path.join(__dirname, '../../database/schema.sql');
            const sql = fs.readFileSync(actualPath, 'utf8');
            // Try to run schema but catch error if tables exist
            try {
                const cleanSql = sql.replace(/\\c .*/g, '-- switched db');
                await pool.query(cleanSql);
                statusLog.push("✅ Schema executed (Tables created/reset).");
            } catch (e: any) {
                statusLog.push(`⚠️ Schema execution skipped/failed (Tables might exist): ${e.message}`);
            }
        } else {
            statusLog.push("⚠️ Schema file not found, skipping schema execution.");
        }

        // 2. Force Reset Admin Password
        statusLog.push("Resetting Admin Password...");
        try {
            // First, ensure Admin exists if schema didn't run
            const userCheck = await pool.query("SELECT * FROM users WHERE employee_id = 'ADMIN001'");
            if (userCheck.rows.length === 0) {
                statusLog.push("⚠️ Admin not found, inserting manual admin...");
                await pool.query(`INSERT INTO users (employee_id, full_name, email, password_hash, role, is_active) 
                                   VALUES ('ADMIN001', 'System Admin', 'admin@example.com', $1, 'admin', true)`, [newHash]);
            } else {
                await pool.query(
                    `UPDATE users SET password_hash = $1, is_active = true WHERE employee_id = 'ADMIN001'`,
                    [newHash]
                );
            }
            statusLog.push("✅ Admin password reset to: 123123");
        } catch (e: any) {
            statusLog.push(`❌ Failed to reset password: ${e.message}`);
        }

        // 3. DEBUG: Fetch and Show User Data
        const debugUser = await pool.query("SELECT id, employee_id, role, is_active, password_hash, full_name FROM users WHERE employee_id = 'ADMIN001'");
        let userData = null;
        let passwordTest = false;

        if (debugUser.rows.length > 0) {
            userData = debugUser.rows[0];
            passwordTest = await comparePassword(simplePass, userData.password_hash);
            statusLog.push(`🔍 DEBUG CHECK: User found. Active=${userData.is_active}. Password '123123' match=${passwordTest}`);
        } else {
            statusLog.push("❌ DEBUG CHECK: User ADMIN001 NOT FOUND after attempts!");
        }

        res.json({
            success: true,
            logs: statusLog,
            user_debug: {
                found: !!userData,
                details: userData ? {
                    id: userData.id,
                    employee_id: userData.employee_id,
                    role: userData.role,
                    is_active: userData.is_active,
                    hash_preview: userData.password_hash.substring(0, 15) + '...'
                } : null,
                login_test: {
                    attempt_password: simplePass,
                    will_succeed: passwordTest
                }
            }
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// ============================================
// Middleware
// ============================================
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
}));
app.use(morgan('dev'));
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'https://technical-assistant-frontend.onrender.com', // Explicitly allowed
    process.env.CLIENT_URL || ''
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin); // Log blocked origin for debugging
            // Temporarily allow ALL origins to fix the issue, then we can restrict later
            callback(null, true);
        }
    },
    credentials: true,
}));
app.use(express.json({ limit: '250mb' }));
app.use(express.urlencoded({ extended: true, limit: '250mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ============================================
// Health Check
// ============================================
console.log('🔄 Server Restarting... Triggering reload (Users Controller Update).');
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'OK',
        message: 'Intelligent Technical Assistant API is running',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString(),
    });
});

// ============================================
// API Routes
// ============================================

// Authentication routes
app.use('/api/auth', authRoutes);

// Users routes
app.use('/api/users', usersRoutes);

// Vehicles routes
app.use('/api/vehicles', vehiclesRoutes);

// Faults routes
app.use('/api/faults', faultsRoutes);

// Maintenance routes
app.use('/api/maintenance', maintenanceRoutes);

// Dashboard routes
app.use('/api/dashboard', dashboardRoutes);

// Diagnosis routes
app.use('/api/diagnosis', diagnosisRoutes);

// Systems diagnosis routes
app.use('/api/diagnosis/systems', systemsRoutes);

// Repair routes
app.use('/api/repair', repairRoutes);

// Upload routes
app.use('/api/upload', uploadRoutes);

// Serve uploaded files (manuals, images, etc.)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// AI routes
app.use('/api/ai', aiRoutes);

// Units routes
app.use('/api/units', unitsRoutes);

// API info
app.get('/api', (req: Request, res: Response) => {
    res.json({
        message: 'Welcome to Intelligent Technical Assistant API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            api: '/api',
            auth: {
                login: 'POST /api/auth/login',
                logout: 'POST /api/auth/logout',
                me: 'GET /api/auth/me',
                refresh: 'POST /api/auth/refresh',
            },
            users: {
                list: 'GET /api/users',
                get: 'GET /api/users/:id',
                create: 'POST /api/users',
                update: 'PUT /api/users/:id',
                delete: 'DELETE /api/users/:id',
                updateStatus: 'PATCH /api/users/:id/status',
                changePassword: 'PATCH /api/users/:id/password',
            },
            vehicles: {
                list: 'GET /api/vehicles',
                get: 'GET /api/vehicles/:id',
                create: 'POST /api/vehicles',
                update: 'PUT /api/vehicles/:id',
                delete: 'DELETE /api/vehicles/:id',
                updateStatus: 'PATCH /api/vehicles/:id/status',
                updateKm: 'PATCH /api/vehicles/:id/km',
                stats: 'GET /api/vehicles/:id/stats',
                faults: 'GET /api/vehicles/:id/faults',
                maintenance: 'GET /api/vehicles/:id/maintenance',
            },
            faults: {
                list: 'GET /api/faults',
                get: 'GET /api/faults/:id',
                create: 'POST /api/faults',
                updateStatus: 'PATCH /api/faults/:id/status',
                resolve: 'POST /api/faults/:id/resolve',
            },
            maintenance: {
                list: 'GET /api/maintenance',
                create: 'POST /api/maintenance',
                updateStatus: 'PATCH /api/maintenance/:id/status',
                complete: 'POST /api/maintenance/:id/complete',
            },
            dashboard: {
                stats: 'GET /api/dashboard/stats',
                recentActivity: 'GET /api/dashboard/recent-activity',
            },
        },
    });
});

// ============================================
// 404 Handler
// ============================================
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path,
    });
});

// ============================================
// Error Handler
// ============================================
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// ============================================
// Initialize Database and Start Server
// ============================================
const startServer = async () => {
    try {
        // Initialize SQL Server connection pool
        await initializePool();

        // Start Express server
        app.listen(PORT, () => {
            console.log('');
            console.log('═══════════════════════════════════════════════════════');
            console.log('🚀 Intelligent Technical Assistant API');
            console.log('═══════════════════════════════════════════════════════');
            console.log(`📡 Server:      http://localhost:${PORT}`);
            console.log(`📊 Database:    PostgreSQL`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`⏰ Started:     ${new Date().toLocaleString('ar-SA')}`);
            console.log('═══════════════════════════════════════════════════════');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// ============================================
// Graceful Shutdown
// ============================================
const shutdown = async (signal: string) => {
    console.log(`\n${signal} signal received: closing HTTP server`);
    await closePool();
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ============================================
// Start the Server
// ============================================
startServer();

export default app;
