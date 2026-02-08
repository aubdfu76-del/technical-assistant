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

dotenv.config();

console.log('🔄 Server Restarting... (Full Setup Mode)');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// TEMPORARY SETUP ROUTE
// ============================================
app.get('/setup-db-force', async (req: Request, res: Response) => {
    try {
        const pool = getPool();
        const schemaPath = path.join(__dirname, '../database/schema.sql');

        if (!fs.existsSync(schemaPath)) {
            // Try looking in root if not in dist
            const schemaPathRoot = path.join(__dirname, '../../database/schema.sql');
            if (fs.existsSync(schemaPathRoot)) {
                const sql = fs.readFileSync(schemaPathRoot, 'utf8');
                // Remove \c command as it fails in pool connection
                const cleanSql = sql.replace(/\\c .*/g, '-- switched db');
                await pool.query(cleanSql);
                res.send('✅ Database Setup Complete! Tables created and Admin user inserted. You can now login with ADMIN001 / password123');
                return;
            }
            res.status(500).send('Schema file not found');
            return;
        }

        const sql = fs.readFileSync(schemaPath, 'utf8');
        // Remove \c command
        const cleanSql = sql.replace(/\\c .*/g, '-- switched db');

        await pool.query(cleanSql);
        res.send('✅ Database Setup Complete! Tables created and Admin user inserted. You can now login with ADMIN001 / password123');
    } catch (error: any) {
        console.error('Setup failed:', error);
        res.status(500).send(`❌ Setup Failed: ${error.message}`);
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
    process.env.CLIENT_URL || ''
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
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
