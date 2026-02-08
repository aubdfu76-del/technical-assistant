import { Request, Response } from 'express';
import { getPool } from '../config/database';

/**
 * Get all faults with pagination and filtering
 * @route GET /api/faults
 * @access Private
 */
export const getFaults = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status as string;
        const severity = req.query.severity as string;
        const vehicle_id = req.query.vehicle_id as string;

        const pool = getPool();

        let query = `
            SELECT f.*, v.plate_number, v.vehicle_type, u.full_name as reported_by_name
            FROM faults f
            JOIN vehicles v ON f.vehicle_id = v.id
            LEFT JOIN users u ON f.reported_by = u.id
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND f.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (severity) {
            query += ` AND f.severity = $${paramIndex}`;
            params.push(severity);
            paramIndex++;
        }

        if (vehicle_id) {
            query += ` AND f.vehicle_id = $${paramIndex}`;
            params.push(vehicle_id);
            paramIndex++;
        }

        // Count total for pagination
        const countResult = await pool.query(`SELECT COUNT(*) FROM (${query}) as total`, params);
        const total = parseInt(countResult.rows[0].count);

        query += ` ORDER BY f.reported_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('❌ Get faults error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب الأعطال' });
    }
};

/**
 * Get fault by ID
 * @route GET /api/faults/:id
 */
export const getFaultById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const pool = getPool();
        const result = await pool.query(`
            SELECT f.*, v.plate_number, u.full_name as reported_by_name
            FROM faults f
            JOIN vehicles v ON f.vehicle_id = v.id
            LEFT JOIN users u ON f.reported_by = u.id
            WHERE f.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'العطل غير موجود' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('❌ Get fault by ID error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب بيانات العطل' });
    }
};

/**
 * Create new fault
 * @route POST /api/faults
 */
export const createFault = async (req: Request, res: Response) => {
    try {
        const { vehicle_id, fault_code, title, description, severity, category, system_affected } = req.body;
        const reported_by = (req as any).user.userId;

        const pool = getPool();

        // Check if vehicle exists
        const vehicleCheck = await pool.query('SELECT id FROM vehicles WHERE id = $1', [vehicle_id]);
        if (vehicleCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'المعدة المحددة غير موجودة' });
        }

        const result = await pool.query(
            `INSERT INTO faults (vehicle_id, fault_code, title, description, severity, category, system_affected, reported_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [vehicle_id, fault_code, title, description, severity || 'medium', category, system_affected, reported_by]
        );

        res.status(201).json({ success: true, message: 'تم تسجيل العطل بنجاح', data: result.rows[0] });
    } catch (error) {
        console.error('❌ Create fault error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء تسجيل العطل' });
    }
};

/**
 * Update fault status
 * @route PATCH /api/faults/:id/status
 */
export const updateFaultStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const pool = getPool();
        const result = await pool.query(
            'UPDATE faults SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'العطل غير موجود' });
        }

        res.json({ success: true, message: 'تم تحديث حالة العطل بنجاح', data: result.rows[0] });
    } catch (error) {
        console.error('❌ Update fault status error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث حالة العطل' });
    }
};

/**
 * Resolve fault
 * @route POST /api/faults/:id/resolve
 */
export const resolveFault = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { resolution_notes } = req.body;

        const pool = getPool();
        const result = await pool.query(
            `UPDATE faults 
             SET status = 'resolved', resolution_notes = $1, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 RETURNING *`,
            [resolution_notes, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'العطل غير موجود' });
        }

        res.json({ success: true, message: 'تم إنهاء العطل بنجاح', data: result.rows[0] });
    } catch (error) {
        console.error('❌ Resolve fault error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء إغلاق العطل' });
    }
};
