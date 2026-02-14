import { Request, Response } from 'express';
import { getPool } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password.util';

/**
 * Get all users with pagination and filtering
 * @route GET /api/users
 * @access Private (admin, supervisor)
 */
export const getUsers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const role = req.query.role as string;
        const search = req.query.search as string;

        console.log('GET /users params:', req.query); // Debug log

        const pool = getPool();

        // Build query
        let query = `
            SELECT 
                id, employee_id, full_name, email, role, phone, unit_id,
                is_active, last_login, created_at, updated_at
            FROM users
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        // Check user role for permission scope
        const currentUser = (req as any).user;
        if (currentUser.role === 'supervisor') {
            // Get supervisor's unit
            const supervisorUnit = await pool.query('SELECT unit_id FROM users WHERE id = $1', [currentUser.userId]);
            const unitId = supervisorUnit.rows[0]?.unit_id;

            if (unitId) {
                query += ` AND unit_id = $${paramIndex}`;
                params.push(unitId);
                paramIndex++;

                // Supervisor can only see technicians? Or maybe other supervisors in same unit too?
                // Usually supervisor manages technicians.
                // Let's filter role too if not specified? 
                // If the supervisor filters by 'technician', it works. If they want to see all in unit, it works.
            } else {
                // Supervisor not assigned to any unit -> sees nothing? or self only?
                // Let's safe default to seeing nothing or just self
                query += ` AND 1=0`; // No results
            }
        }

        // Add role filter
        if (role && ['admin', 'supervisor', 'technician'].includes(role)) {
            query += ` AND role = $${paramIndex}`;
            params.push(role);
            paramIndex++;
        }

        // Add search filter
        if (search) {
            query += ` AND (
                full_name ILIKE $${paramIndex} OR 
                employee_id ILIKE $${paramIndex} OR 
                email ILIKE $${paramIndex}
            )`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        // Add status filter
        if (req.query.is_active !== undefined) {
            query += ` AND is_active = $${paramIndex}`;
            params.push(req.query.is_active === 'true');
            paramIndex++;
        }

        // Add unit filter (if provided)
        if (req.query.unit_id) {
            query += ` AND unit_id = $${paramIndex}`;
            params.push(req.query.unit_id);
            paramIndex++;
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM (${query}) as filtered_users`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Add pagination
        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        // Execute query
        const result = await pool.query(query, params);

        // If specific page requested but no results, and page > 1, this might mean we deleted the last item on the page.
        // In a real scenario, we might want to suggest the previous page, but automatic fallback can be confusing.
        // However, the frontend should ideally handle this.
        // Let's just return what we have.

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit) || 1,
            },
        });

        console.log(`✅ Retrieved ${result.rows.length} users (page ${page})`);
    } catch (error) {
        console.error('❌ Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب المستخدمين',
        });
    }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 * @access Private (admin, supervisor)
 */
export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const pool = getPool();
        const result = await pool.query(
            `SELECT 
                id, employee_id, full_name, email, role, phone, unit_id,
                is_active, last_login, created_at, updated_at
            FROM users 
            WHERE id = $1`,
            [id]
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

        console.log(`✅ Retrieved user: ${result.rows[0].employee_id}`);
    } catch (error) {
        console.error('❌ Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب بيانات المستخدم',
        });
    }
};

/**
 * Create new user
 * @route POST /api/users
 * @access Private (admin only)
 */
export const createUser = async (req: Request, res: Response) => {
    try {
        const { employee_id, full_name, email, password, role, phone, unit_id } = req.body;

        console.log('📝 Create User Request:', {
            employee_id,
            full_name,
            email,
            role,
            phone,
            unit_id,
            password_length: password?.length
        });

        const pool = getPool();

        // Check if employee_id already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE employee_id = $1',
            [employee_id]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'رقم الموظف مستخدم بالفعل',
            });
        }

        // Check if email already exists (if provided)
        if (email) {
            const existingEmail = await pool.query(
                'SELECT id FROM users WHERE email = $1',
                [email]
            );

            if (existingEmail.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'البريد الإلكتروني مستخدم بالفعل',
                });
            }
        });

        // Validate password exists
        if (!password || password.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'كلمة المرور مطلوبة',
            });
        }

        // Hash password
        const password_hash = await hashPassword(password);

        // Insert user
        const result = await pool.query(
            `INSERT INTO users (employee_id, full_name, email, password_hash, role, phone, unit_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, employee_id, full_name, email, role, phone, unit_id, is_active, created_at`,
            [employee_id, full_name, email || null, password_hash, role || 'technician', phone || null, unit_id || null]
        );

        res.status(201).json({
            success: true,
            message: 'تم إنشاء المستخدم بنجاح',
            data: result.rows[0],
        });

        console.log(`✅ Created user: ${employee_id} (${role || 'technician'})`);
    } catch (error: any) {
        console.error('❌ Create user error:', error);
        console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });

        if (error.code === '23505') { // Unique violation
            return res.status(409).json({
                success: false,
                message: 'رقم الموظف أو البريد الإلكتروني مستخدم بالفعل',
            });
        }

        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء إنشاء المستخدم: ' + error.message,
        });
    }
};

/**
 * Update user
 * @route PUT /api/users/:id
 * @access Private (admin only)
 */
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log(`📝 Update Request for User ${id}:`, req.body);

        const { employee_id, full_name, email, role, phone, unit_id } = req.body;

        const pool = getPool();

        // Check if user exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE id = $1',
            [id]
        );

        if (existingUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود',
            });
        }

        // Check for duplicate employee_id (if changing)
        if (employee_id) {
            const duplicate = await pool.query(
                'SELECT id FROM users WHERE employee_id = $1 AND id != $2',
                [employee_id, id]
            );

            if (duplicate.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'رقم الموظف مستخدم بالفعل',
                });
            }
        }

        // Check for duplicate email (if changing)
        if (email) {
            const duplicate = await pool.query(
                'SELECT id FROM users WHERE email = $1 AND id != $2',
                [email, id]
            );

            if (duplicate.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'البريد الإلكتروني مستخدم بالفعل',
                });
            }
        }

        // Build update query dynamically
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (employee_id !== undefined) {
            updates.push(`employee_id = $${paramIndex}`);
            values.push(employee_id);
            paramIndex++;
        }
        if (full_name !== undefined) {
            updates.push(`full_name = $${paramIndex}`);
            values.push(full_name);
            paramIndex++;
        }
        if (email !== undefined) {
            updates.push(`email = $${paramIndex}`);
            values.push(email || null);
            paramIndex++;
        }
        if (role !== undefined) {
            updates.push(`role = $${paramIndex}`);
            values.push(role);
            paramIndex++;
        }
        if (phone !== undefined) {
            updates.push(`phone = $${paramIndex}`);
            values.push(phone || null);
            paramIndex++;
        }
        if (unit_id !== undefined) {
            updates.push(`unit_id = $${paramIndex}`);
            values.push(unit_id || null);
            paramIndex++;
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'لا توجد بيانات للتحديث',
            });
        }

        // Add ID to values
        values.push(id);

        // Execute update
        const result = await pool.query(
            `UPDATE users 
             SET ${updates.join(', ')}
             WHERE id = $${paramIndex}
             RETURNING id, employee_id, full_name, email, role, phone, is_active, updated_at`,
            values
        );

        res.json({
            success: true,
            message: 'تم تحديث المستخدم بنجاح',
            data: result.rows[0],
        });

        console.log(`✅ Updated user: ${result.rows[0].employee_id}`);
    } catch (error: any) {
        console.error('❌ Update user error:', error);

        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'رقم الموظف أو البريد الإلكتروني مستخدم بالفعل',
            });
        }

        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء تحديث المستخدم',
        });
    }
};

/**
 * Delete user
 * @route DELETE /api/users/:id
 * @access Private (admin only)
 */
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const currentUser = (req as any).user;

        // Prevent self-deletion
        if (parseInt(id) === currentUser.userId) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكنك حذف حسابك الخاص',
            });
        }

        const pool = getPool();

        // Check if user exists
        const existingUser = await pool.query(
            'SELECT employee_id, role FROM users WHERE id = $1',
            [id]
        );

        if (existingUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود',
            });
        }

        // Supervisor can only delete technicians
        if (currentUser.role === 'supervisor' && existingUser.rows[0].role !== 'technician') {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية لحذف هذا المستخدم',
            });
        }

        // Delete user
        await pool.query('DELETE FROM users WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'تم حذف المستخدم بنجاح',
        });

        console.log(`✅ Deleted user: ${existingUser.rows[0].employee_id}`);
    } catch (error) {
        console.error('❌ Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء حذف المستخدم',
        });
    }
};

/**
 * Update user status (activate/deactivate)
 * @route PATCH /api/users/:id/status
 * @access Private (admin only)
 */
export const updateUserStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        const currentUser = (req as any).user;

        // Prevent self-deactivation
        if (parseInt(id) === currentUser.userId && !is_active) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكنك تعطيل حسابك الخاص',
            });
        }

        const pool = getPool();

        // Check if user exists and check role
        const targetUser = await pool.query(
            'SELECT role FROM users WHERE id = $1',
            [id]
        );

        if (targetUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود',
            });
        }

        // Supervisor can only update technicians
        if (currentUser.role === 'supervisor' && targetUser.rows[0].role !== 'technician') {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية لتعديل حالة هذا المستخدم',
            });
        }

        const result = await pool.query(
            `UPDATE users 
             SET is_active = $1
             WHERE id = $2
             RETURNING id, employee_id, full_name, is_active`,
            [is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود',
            });
        }

        res.json({
            success: true,
            message: is_active ? 'تم تفعيل المستخدم بنجاح' : 'تم تعطيل المستخدم بنجاح',
            data: result.rows[0],
        });

        console.log(`✅ Updated user status: ${result.rows[0].employee_id} -> ${is_active ? 'active' : 'inactive'}`);
    } catch (error) {
        console.error('❌ Update user status error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء تحديث حالة المستخدم',
        });
    }
};

/**
 * Change user password
 * @route PATCH /api/users/:id/password
 * @access Private (admin or self)
 */
export const changePassword = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { current_password, new_password } = req.body;
        const currentUser = (req as any).user;

        // Only admin or the user themselves can change password
        if (currentUser.role !== 'admin' && parseInt(id) !== currentUser.userId) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية لتغيير كلمة مرور هذا المستخدم',
            });
        }

        const pool = getPool();

        // Get user's current password
        const result = await pool.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود',
            });
        }

        // Verify current password (if not admin)
        if (currentUser.role !== 'admin') {
            const isValid = await comparePassword(current_password, result.rows[0].password_hash);

            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    message: 'كلمة المرور الحالية غير صحيحة',
                });
            }
        }

        // Hash new password
        const new_password_hash = await hashPassword(new_password);

        // Update password
        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [new_password_hash, id]
        );

        res.json({
            success: true,
            message: 'تم تغيير كلمة المرور بنجاح',
        });

        console.log(`✅ Password changed for user ID: ${id}`);
    } catch (error) {
        console.error('❌ Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء تغيير كلمة المرور',
        });
    }
};
/**
 * Get assigned vehicles for a user (trainer)
 * @route GET /api/users/:id/vehicles
 * @access Private (admin, supervisor, trainer)
 */
export const getUserVehicles = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const result = await pool.query(
            `SELECT v.id, v.plate_number, v.vehicle_type, v.model 
             FROM vehicles v
             JOIN user_vehicle_allocations uva ON v.id = uva.vehicle_id
             WHERE uva.user_id = $1`,
            [id]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('❌ Get user vehicles error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب المركبات المخصصة',
        });
    }
};

/**
 * Update assigned vehicles for a user
 * @route PUT /api/users/:id/vehicles
 * @access Private (admin only)
 */
export const updateUserVehicles = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { vehicle_ids } = req.body; // Array of vehicle IDs
        const pool = getPool();

        // Start transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Delete existing allocations
            await client.query('DELETE FROM user_vehicle_allocations WHERE user_id = $1', [id]);

            // Insert new allocations
            if (vehicle_ids && vehicle_ids.length > 0) {
                const values = vehicle_ids.map((vid: number) => `(${id}, ${vid})`).join(',');
                await client.query(
                    `INSERT INTO user_vehicle_allocations (user_id, vehicle_id) VALUES ${values}`
                );
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'تم تحديث تخصيص المركبات بنجاح',
            });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Update user vehicles error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء تحديث تخصيص المركبات',
        });
    }
};
