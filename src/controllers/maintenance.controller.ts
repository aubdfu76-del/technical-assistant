import { Request, Response } from 'express';
import { getPool } from '../config/database';

/**
 * Get all maintenance tasks
 * @route GET /api/maintenance
 */
export const getMaintenanceTasks = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status as string;

        const pool = getPool();

        let query = `
            SELECT m.*, v.plate_number, u.full_name as assigned_to_name
            FROM maintenance_tasks m
            JOIN vehicles v ON m.vehicle_id = v.id
            LEFT JOIN users u ON m.assigned_to = u.id
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND m.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        // Filter for Trainer
        const currentUser = (req as any).user;
        if (currentUser && currentUser.role === 'trainer') {
            query += ` AND m.vehicle_id IN (SELECT vehicle_id FROM user_vehicle_allocations WHERE user_id = $${paramIndex})`;
            params.push(currentUser.userId);
            paramIndex++;
        }

        const countResult = await pool.query(`SELECT COUNT(*) FROM (${query}) as total`, params);
        const total = parseInt(countResult.rows[0].count);

        query += ` ORDER BY m.scheduled_date ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('❌ Get maintenance tasks error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب مهام الصيانة' });
    }
};

/**
 * Create maintenance task
 * @route POST /api/maintenance
 */
export const createMaintenanceTask = async (req: Request, res: Response) => {
    try {
        const { vehicle_id, fault_id, task_type, title, description, priority, assigned_to, scheduled_date, estimated_hours } = req.body;
        const currentUser = (req as any).user;
        const pool = getPool();

        // Check permission for Trainer
        if (currentUser.role === 'trainer') {
            const check = await pool.query(
                'SELECT 1 FROM user_vehicle_allocations WHERE user_id = $1 AND vehicle_id = $2',
                [currentUser.userId, vehicle_id]
            );
            if (check.rows.length === 0) {
                return res.status(403).json({ success: false, message: 'ليس لديك صلاحية لإضافة مهام لهذه المركبة' });
            }
        }

        const result = await pool.query(
            `INSERT INTO maintenance_tasks (vehicle_id, fault_id, task_type, title, description, priority, assigned_to, scheduled_date, estimated_hours)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [vehicle_id, fault_id || null, task_type, title, description || null, priority || 'normal', assigned_to || null, scheduled_date || null, estimated_hours || null]
        );

        res.status(201).json({ success: true, message: 'تم إنشاء مهمة الصيانة بنجاح', data: result.rows[0] });
    } catch (error) {
        console.error('❌ Create maintenance task error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء إنشاء مهمة الصيانة' });
    }
};

/**
 * Update task status
 * @route PATCH /api/maintenance/:id/status
 */
export const updateTaskStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const pool = getPool();

        let updateQuery = 'UPDATE maintenance_tasks SET status = $1, updated_at = CURRENT_TIMESTAMP';
        const params = [status, id];

        if (status === 'in_progress') {
            updateQuery += ', started_date = COALESCE(started_date, CURRENT_TIMESTAMP)';
        }

        updateQuery += ' WHERE id = $2 RETURNING *';

        const result = await pool.query(updateQuery, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'المهمة غير موجودة' });
        }

        res.json({ success: true, message: 'تم تحديث حالة المهمة', data: result.rows[0] });
    } catch (error) {
        console.error('❌ Update task status error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث الحالة' });
    }
};

/**
 * Complete task
 * @route POST /api/maintenance/:id/complete
 */
export const completeTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { actual_hours, cost, parts_used, notes } = req.body;

        const pool = getPool();

        const result = await pool.query(
            `UPDATE maintenance_tasks 
             SET status = 'completed', completed_date = CURRENT_TIMESTAMP, actual_hours = $1, cost = $2, parts_used = $3, notes = $4, updated_at = CURRENT_TIMESTAMP
             WHERE id = $5 RETURNING *`,
            [actual_hours, cost, parts_used || null, notes || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'المهمة غير موجودة' });
        }

        // Optional: Trigger an update to vehicle's last_maintenance_date
        const taskId = result.rows[0].id;
        const vehicleId = result.rows[0].vehicle_id;
        await pool.query('UPDATE vehicles SET last_maintenance_date = CURRENT_TIMESTAMP WHERE id = $1', [vehicleId]);

        res.json({ success: true, message: 'تم إكمال مهمة الصيانة بنجاح', data: result.rows[0] });
    } catch (error) {
        console.error('❌ Complete task error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء إغلاق المهمة' });
    }
};
