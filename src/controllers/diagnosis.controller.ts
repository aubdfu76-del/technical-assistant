import { Request, Response } from 'express';
import { getPool } from '../config/database';

/**
 * Get all common faults with their counts of symptoms/causes
 * @route GET /api/diagnosis/common
 */
export const getCommonFaults = async (req: Request, res: Response) => {
    try {
        const { vehicle_id } = req.query;
        const pool = getPool();

        let query = `
            SELECT cf.*, 
                   (SELECT COUNT(*) FROM fault_symptoms WHERE fault_id = cf.id) as symptoms_count,
                   (SELECT COUNT(*) FROM fault_causes WHERE fault_id = cf.id) as causes_count
            FROM common_faults cf
            WHERE 1=1
        `;

        const params: any[] = [];
        let paramIndex = 1;

        if (vehicle_id) {
            query += ` AND (
                cf.vehicle_ids IS NULL 
                OR cardinality(cf.vehicle_ids) = 0 
                OR $${paramIndex} = ANY(cf.vehicle_ids)
            )`;
            params.push(parseInt(vehicle_id as string));
            paramIndex++;
        }

        // Trainer restriction
        const currentUser = (req as any).user;
        if (currentUser && currentUser.role === 'trainer') {
            // Find allowed vehicles
            const allowed = await pool.query('SELECT vehicle_id FROM user_vehicle_allocations WHERE user_id = $1', [currentUser.userId]);
            const allowedIds = allowed.rows.map(r => r.vehicle_id as number);

            if (allowedIds.length === 0) {
                return res.json({ success: true, data: [] });
            }

            query += ` AND (
                cf.vehicle_ids && $${paramIndex}::integer[]
             )`;
            params.push(allowedIds);
            paramIndex++;
        }

        query += ' ORDER BY cf.severity DESC, cf.created_at DESC';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('❌ Get common faults error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب الأعطال الشائعة' });
    }
};

/**
 * Get detailed info for a common fault (symptoms & causes)
 * @route GET /api/diagnosis/common/:id
 */
export const getCommonFaultDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const faultResult = await pool.query('SELECT * FROM common_faults WHERE id = $1', [id]);

        if (faultResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'العطل غير موجود' });
        }

        const symptomsResult = await pool.query('SELECT description FROM fault_symptoms WHERE fault_id = $1', [id]);
        const causesResult = await pool.query('SELECT description FROM fault_causes WHERE fault_id = $1', [id]);

        res.json({
            success: true,
            data: {
                ...faultResult.rows[0],
                symptoms: symptomsResult.rows.map(r => r.description),
                causes: causesResult.rows.map(r => r.description)
            }
        });
    } catch (error) {
        console.error('❌ Get common fault details error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب تفاصيل العطل' });
    }
};

/**
 * Add a new common fault (Admin/Supervisor Only)
 * @route POST /api/diagnosis/common
 */
export const createCommonFault = async (req: Request, res: Response) => {
    try {
        const { title, description, severity, category, recommended_system, symptoms, causes, vehicle_ids } = req.body;
        const created_by = (req as any).user.userId;
        const currentUser = (req as any).user;
        const pool = getPool();
        const vIds = Array.isArray(vehicle_ids) ? vehicle_ids : [];

        // Check permissions for Trainer
        if (currentUser.role === 'trainer') {
            if (vIds.length === 0) {
                return res.status(403).json({ success: false, message: 'المدرب يجب أن يحدد مركبة واحدة على الأقل' });
            }

            const allowed = await pool.query('SELECT vehicle_id FROM user_vehicle_allocations WHERE user_id = $1', [currentUser.userId]);
            const allowedIds = allowed.rows.map(r => r.vehicle_id);

            const isAllowed = vIds.every((vid: number) => allowedIds.includes(vid));
            if (!isAllowed) {
                return res.status(403).json({ success: false, message: 'ليس لديك صلاحية لإضافة أعطال لبعض المركبات المختارة' });
            }
        }

        // Start transaction
        await pool.query('BEGIN');

        const faultResult = await pool.query(
            `INSERT INTO common_faults (title, description, severity, category, recommended_system, created_by, vehicle_ids)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [title, description, severity, category, recommended_system, created_by, vIds]
        );

        const faultId = faultResult.rows[0].id;

        // Insert symptoms
        if (symptoms && Array.isArray(symptoms)) {
            for (const symptom of symptoms) {
                await pool.query('INSERT INTO fault_symptoms (fault_id, description) VALUES ($1, $2)', [faultId, symptom]);
            }
        }

        // Insert causes
        if (causes && Array.isArray(causes)) {
            for (const cause of causes) {
                await pool.query('INSERT INTO fault_causes (fault_id, description) VALUES ($1, $2)', [faultId, cause]);
            }
        }

        await pool.query('COMMIT');

        res.status(201).json({ success: true, message: 'تم إضافة العطل الشائع بنجاح' });
    } catch (error) {
        const pool = getPool();
        await pool.query('ROLLBACK');
        console.error('❌ Create common fault error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء إضافة العطل' });
    }
};

/**
 * Delete a common fault (Admin/Supervisor Only)
 * @route DELETE /api/diagnosis/common/:id
 */
export const deleteCommonFault = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const pool = getPool();
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Delete associated symptoms
            await client.query('DELETE FROM fault_symptoms WHERE fault_id = $1', [id]);

            // 2. Delete associated causes
            await client.query('DELETE FROM fault_causes WHERE fault_id = $1', [id]);

            // 3. Delete the fault itself
            await client.query('DELETE FROM common_faults WHERE id = $1', [id]);

            await client.query('COMMIT');

            res.json({ success: true, message: 'تم حذف العطل بنجاح' });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Delete common fault error:', error);
        res.status(500).json({ success: false, message: 'فشل في حذف العطل' });
    }
};
