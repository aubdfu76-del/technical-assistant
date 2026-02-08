import { Request, Response } from 'express';
import { getPool } from '../config/database';

/**
 * Get all units
 * @route GET /api/units
 */
export const getUnits = async (req: Request, res: Response) => {
    try {
        const pool = getPool();
        const result = await pool.query('SELECT * FROM units ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('❌ Get units error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب الوحدات' });
    }
};

/**
 * Create a new unit (Admin Only)
 * @route POST /api/units
 */
export const createUnit = async (req: Request, res: Response) => {
    try {
        console.log('📝 Request to create unit:', req.body);
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'اسم الوحدة مطلوب' });
        }

        const pool = getPool();
        const result = await pool.query(
            'INSERT INTO units (name) VALUES ($1) RETURNING *',
            [name]
        );

        res.status(201).json({ success: true, message: 'تم إنشاء الوحدة بنجاح', data: result.rows[0] });
    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(409).json({ success: false, message: 'اسم الوحدة موجود بالفعل' });
        }
        console.error('❌ Create unit error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء إنشاء الوحدة' });
    }
};

/**
 * Delete a unit (Admin Only)
 * @route DELETE /api/units/:id
 */
export const deleteUnit = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        await pool.query('DELETE FROM units WHERE id = $1', [id]);

        res.json({ success: true, message: 'تم حذف الوحدة بنجاح' });
    } catch (error) {
        console.error('❌ Delete unit error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء حذف الوحدة' });
    }
};
