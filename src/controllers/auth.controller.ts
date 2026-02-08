import { Request, Response } from 'express';
import { getPool } from '../config/database';
import { comparePassword, hashPassword } from '../utils/password.util';
import { generateToken } from '../utils/jwt.util';

/**
 * Login controller
 * Authenticates user and returns JWT token
 */
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
            // Check if user exists but is inactive
            const inactiveUser = await pool.query(
                'SELECT id FROM users WHERE employee_id = $1 AND is_active = false',
                [employee_id]
            );

            if (inactiveUser.rows.length > 0) {
                return res.status(403).json({
                    success: false,
                    message: 'حسابك بانتظار موافقة مدير النظام',
                });
            }

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

        // Update last login timestamp
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
                    phone: user.phone,
                },
            },
        });

        console.log(`✅ User logged in: ${user.employee_id} (${user.role})`);
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء تسجيل الدخول',
        });
    }
}


/**
 * Register controller
 * Registers a new supervisor with pending status
 */
export const register = async (req: Request, res: Response) => {
    try {
        const { employee_id, password, full_name, email, phone, unit_id } = req.body;

        // Validate input
        if (!employee_id || !password || !full_name) {
            return res.status(400).json({
                success: false,
                message: 'يرجى إدخال جميع البيانات المطلوبة',
            });
        }

        const pool = getPool();

        // Check if user already exists
        const userExists = await pool.query(
            'SELECT id FROM users WHERE employee_id = $1',
            [employee_id]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'رقم الموظف مستخدم بالفعل',
            });
        }

        // Hash password
        const password_hash = await hashPassword(password);

        // Determine role (default to supervisor if not provided or invalid)
        let role = 'supervisor';
        if (req.body.role === 'technician') {
            role = 'technician';
        } else if (req.body.role === 'trainer') {
            role = 'trainer';
        }

        // Insert new user with role and is_active = false
        const is_active = false;

        const result = await pool.query(
            `INSERT INTO users (employee_id, full_name, email, password_hash, role, phone, is_active, unit_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, employee_id, full_name, role`,
            [employee_id, full_name, email || null, password_hash, role, phone || null, is_active, unit_id || null]
        );

        res.status(201).json({
            success: true,
            message: 'تم تسجيل الطلب بنجاح، يرجى انتظار موافقة مدير النظام',
            data: result.rows[0],
        });

        console.log(`✅ New registration request: ${employee_id} (${full_name})`);
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء التسجيل: ' + (error as any).message,
        });
    }
};

/**
 * Logout controller
 * In JWT, logout is handled on client side by removing the token
 */
export const logout = async (req: Request, res: Response) => {
    try {
        // You can add logout logging here if needed
        const user = (req as any).user;

        res.json({
            success: true,
            message: 'تم تسجيل الخروج بنجاح',
        });

        console.log(`✅ User logged out: ${user?.employeeId}`);
    } catch (error) {
        console.error('❌ Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء تسجيل الخروج',
        });
    }
};

/**
 * Get current user controller
 * Returns the authenticated user's information
 */
export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const pool = getPool();
        const result = await pool.query(
            `SELECT 
                id, 
                employee_id, 
                full_name, 
                email, 
                role, 
                phone,
                is_active,
                last_login,
                created_at
            FROM users 
            WHERE id = $1`,
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
        console.error('❌ Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب بيانات المستخدم',
        });
    }
};

/**
 * Refresh token controller
 * Generates a new token for the authenticated user
 */
export const refreshToken = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        // Generate new token
        const token = generateToken({
            userId: user.userId,
            employeeId: user.employeeId,
            role: user.role,
        });

        res.json({
            success: true,
            message: 'تم تجديد رمز المصادقة بنجاح',
            data: {
                token,
            },
        });

        console.log(`✅ Token refreshed for user: ${user.employeeId}`);
    } catch (error) {
        console.error('❌ Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء تجديد رمز المصادقة',
        });
    }
};
