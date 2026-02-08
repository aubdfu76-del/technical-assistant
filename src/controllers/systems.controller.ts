import { Request, Response } from 'express';
import { getPool } from '../config/database';
import fs from 'fs';
import path from 'path';

/**
 * Get all diagnosis systems with their item counts
 * @route GET /api/diagnosis/systems
 */
export const getDiagnosisSystems = async (req: Request, res: Response) => {
    try {
        const { vehicle_id } = req.query;
        const pool = getPool();

        let query = `
            SELECT ds.*, 
                   ds.icon as icon_name,
                   (SELECT COUNT(*) FROM diagnosis_items WHERE system_id = ds.id) as items_count
            FROM diagnosis_systems ds
            WHERE 1=1
        `;

        const params: any[] = [];
        let paramIndex = 1;

        if (vehicle_id) {
            query += ` AND (
                ds.vehicle_ids IS NULL 
                OR cardinality(ds.vehicle_ids) = 0 
                OR $${paramIndex} = ANY(ds.vehicle_ids)
            )`;
            params.push(parseInt(vehicle_id as string));
            paramIndex++;
        }

        // Trainer restriction
        const currentUser = (req as any).user;
        if (currentUser && currentUser.role === 'trainer') {
            const allowed = await pool.query('SELECT vehicle_id FROM user_vehicle_allocations WHERE user_id = $1', [currentUser.userId]);
            const allowedIds = allowed.rows.map(r => r.vehicle_id as number);

            if (allowedIds.length === 0) {
                return res.json({ success: true, data: [] });
            }

            query += ` AND (
                ds.vehicle_ids && $${paramIndex}::integer[]
             )`;
            params.push(allowedIds);
            paramIndex++;
        }

        query += ' ORDER BY ds.id ASC';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('❌ Get diagnosis systems error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب الأنظمة' });
    }
};

/**
 * Create a new diagnosis system (Admin/Supervisor Only)
 * @route POST /api/diagnosis/systems
 */
export const createDiagnosisSystem = async (req: Request, res: Response) => {
    try {
        const { name, description, icon_name, vehicle_ids } = req.body;
        console.log('📝 Received create system request:', { name, description, icon_name, vehicle_ids });

        // Log to file for debugging
        const logData = `${new Date().toISOString()} - Request: ${JSON.stringify(req.body)}\n`;
        try {
            fs.appendFileSync(path.join(process.cwd(), 'server_debug.log'), logData);
        } catch (e) {
            console.error('Failed to write log', e);
        }

        const pool = getPool();
        const vIds = Array.isArray(vehicle_ids) ? vehicle_ids : [];
        const currentUser = (req as any).user;

        // Check permissions for Trainer
        if (currentUser.role === 'trainer') {
            if (vIds.length === 0) {
                return res.status(403).json({ success: false, message: 'المدرب يجب أن يحدد مركبة واحدة على الأقل' });
            }
            const allowed = await pool.query('SELECT vehicle_id FROM user_vehicle_allocations WHERE user_id = $1', [currentUser.userId]);
            const allowedIds = allowed.rows.map(r => r.vehicle_id);
            const isAllowed = vIds.every((vid: number) => allowedIds.includes(vid));
            if (!isAllowed) {
                return res.status(403).json({ success: false, message: 'ليس لديك صلاحية لإضافة أنظمة لبعض المركبات المختارة' });
            }
        }

        // Check if exists
        // Note: With vehicle isolation, duplicate names might be allowed if they serve different vehicles?
        // But for now, let's keep name unique globally to avoid confusion, or check unique per vehicle?
        // User didn't specify, stick to simple unique name check for now (or skip it if we want flexibility).
        const check = await pool.query('SELECT id FROM diagnosis_systems WHERE name = $1', [name]);
        if (check.rows.length > 0) {
            // If existing system, maybe they want to link it?
            // For now, fail like before.
            return res.status(409).json({ success: false, message: 'اسم النظام موجود بالفعل' });
        }

        const result = await pool.query(
            `INSERT INTO diagnosis_systems (name, description, icon, vehicle_ids)
             VALUES ($1, $2, $3, $4) RETURNING *, icon as icon_name`,
            [name, description, (icon_name || 'settings').toLowerCase(), vIds]
        );

        res.status(201).json({
            success: true,
            message: 'تم إضافة النظام بنجاح',
            data: result.rows[0]
        });
    } catch (error: any) {
        // Log detailed error to file
        const errorLog = `${new Date().toISOString()} - Error: ${error.message}\nStack: ${error.stack}\n`;
        try {
            fs.appendFileSync(path.join(process.cwd(), 'server_debug.log'), errorLog);
        } catch (e) { /* ignore */ }

        console.error('❌ Create diagnosis system error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء إضافة النظام: ' + error.message });
    }
};

/**
 * Get items for a specific system
 * @route GET /api/diagnosis/systems/:id/items
 */
export const getSystemItems = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { vehicle_id } = req.query;
        const pool = getPool();

        let query = 'SELECT * FROM diagnosis_items WHERE system_id = $1';
        const params: any[] = [id];
        let paramIndex = 2;

        if (vehicle_id) {
            query += ` AND (
                vehicle_ids IS NULL 
                OR cardinality(vehicle_ids) = 0 
                OR $${paramIndex} = ANY(vehicle_ids)
            )`;
            params.push(parseInt(vehicle_id as string));
            paramIndex++;
        }

        // Trainer restriction
        const currentUser = (req as any).user;
        if (currentUser && currentUser.role === 'trainer') {
            const allowed = await pool.query('SELECT vehicle_id FROM user_vehicle_allocations WHERE user_id = $1', [currentUser.userId]);
            const allowedIds = allowed.rows.map(r => r.vehicle_id as number);

            if (allowedIds.length === 0) {
                // No vehicle access? Assuming items inherit system access, but if individual access control needed...
                // Actually this endpoint fetches items OF a system. If key restriction is on System GET, this is usually OK.
                // But let's verify if items have checks too.
                // Items have vehicle_ids too. Let's filter items by trainer's vehicles.
                return res.json({ success: true, data: [] });
            }

            // Filter items that match allowed vehicles
            query += ` AND (
                vehicle_ids && $${paramIndex}::integer[]
             )`;
            params.push(allowedIds);
            paramIndex++;
        }

        query += ' ORDER BY id ASC';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('❌ Get system items error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب عناصر الفحص' });
    }
};

/**
 * Get single diagnosis item details with media
 * @route GET /api/diagnosis/systems/items/:id
 */
export const getDiagnosisItemDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const itemResult = await pool.query('SELECT * FROM diagnosis_items WHERE id = $1', [id]);
        if (itemResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'عنصر الفحص غير موجود' });
        }

        const mediaResult = await pool.query('SELECT * FROM diagnosis_media WHERE item_id = $1', [id]);

        res.json({
            success: true,
            data: {
                ...itemResult.rows[0],
                media: mediaResult.rows
            }
        });
    } catch (error) {
        console.error('❌ Get item details error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب تفاصيل حزمة العمل' });
    }
};

/**
 * Create a new diagnosis item for a system (Admin/Supervisor Only)
 * @route POST /api/diagnosis/systems/items
 */
export const createDiagnosisItem = async (req: Request, res: Response) => {
    try {
        const { system_id, title, description, estimated_time, required_tools, safety_procedures, workshop_requirements, technicians_count, vehicle_ids } = req.body;
        const pool = getPool();
        const vIds = Array.isArray(vehicle_ids) ? vehicle_ids : [];
        const currentUser = (req as any).user;

        // Check permissions for Trainer
        if (currentUser.role === 'trainer') {
            if (vIds.length === 0) {
                return res.status(403).json({ success: false, message: 'المدرب يجب أن يحدد مركبة واحدة على الأقل' });
            }
            const allowed = await pool.query('SELECT vehicle_id FROM user_vehicle_allocations WHERE user_id = $1', [currentUser.userId]);
            const allowedIds = allowed.rows.map(r => r.vehicle_id);
            const isAllowed = vIds.every((vid: number) => allowedIds.includes(vid));
            if (!isAllowed) {
                return res.status(403).json({ success: false, message: 'ليس لديك صلاحية لإضافة عناصر لبعض المركبات المختارة' });
            }
        }

        const result = await pool.query(
            `INSERT INTO diagnosis_items (system_id, title, description, estimated_time, required_tools, safety_procedures, workshop_requirements, technicians_count, vehicle_ids)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [system_id, title, description, estimated_time, required_tools, safety_procedures, workshop_requirements, technicians_count, vIds]
        );

        res.status(201).json({
            success: true,
            message: 'تم إضافة إجراء التشخيص بنجاح',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Create diagnosis item error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء إضافة الإجراء' });
    }
};

/**
 * Update diagnosis item content (Work Package) (Admin/Supervisor Only)
 * @route PUT /api/diagnosis/systems/items/:id
 */
export const updateDiagnosisItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, estimated_time, work_package_content, required_tools, safety_procedures, workshop_requirements, technicians_count } = req.body;
        const pool = getPool();

        console.log('📝 Updating Diagnosis Item:', { id });
        console.log('📦 Request Body:', req.body);

        const result = await pool.query(
            `UPDATE diagnosis_items 
             SET title = $1, description = $2, estimated_time = $3, work_package_content = $4, required_tools = $5, safety_procedures = $6, workshop_requirements = $7, technicians_count = $8
             WHERE id = $9 RETURNING *`,
            [title, description, estimated_time, work_package_content, required_tools, safety_procedures, workshop_requirements, technicians_count, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'الإجراء غير موجود' });
        }

        res.json({
            success: true,
            message: 'تم تحديث حزمة العمل بنجاح',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Update diagnosis item error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث حزمة العمل' });
    }
};

/**
 * Add media to a diagnosis item (Admin/Supervisor Only)
 * @route POST /api/diagnosis/systems/items/:id/media
 */
export const addDiagnosisMedia = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { type, url, thumbnail_url } = req.body;
        const pool = getPool();

        const result = await pool.query(
            `INSERT INTO diagnosis_media (item_id, type, url, thumbnail_url)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [id, type, url, thumbnail_url]
        );

        res.status(201).json({
            success: true,
            message: 'تم إضافة الوسائط بنجاح',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Add diagnosis media error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء إضافة الوسائط' });
    }
};

/**
 * Update media (Admin/Supervisor Only)
 * @route PUT /api/diagnosis/systems/media/:mediaId
 */
export const updateDiagnosisMedia = async (req: Request, res: Response) => {
    try {
        const { mediaId } = req.params;
        const { type, url, thumbnail_url } = req.body;
        const pool = getPool();

        const result = await pool.query(
            `UPDATE diagnosis_media 
             SET type = $1, url = $2, thumbnail_url = $3
             WHERE id = $4 RETURNING *`,
            [type, url, thumbnail_url, mediaId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'الوسائط غير موجودة' });
        }

        res.json({
            success: true,
            message: 'تم تحديث الوسائط بنجاح',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Update diagnosis media error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث الوسائط' });
    }
};

/**
 * Delete media (Admin/Supervisor Only)
 * @route DELETE /api/diagnosis/systems/media/:mediaId
 */
export const deleteDiagnosisMedia = async (req: Request, res: Response) => {
    try {
        const { mediaId } = req.params;
        console.log('🗑️ DELETE media request - mediaId:', mediaId);
        const pool = getPool();

        // Get media info first to delete the file
        const mediaResult = await pool.query('SELECT * FROM diagnosis_media WHERE id = $1', [mediaId]);

        if (mediaResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'الوسائط غير موجودة' });
        }

        const media = mediaResult.rows[0];

        // Delete from database
        await pool.query('DELETE FROM diagnosis_media WHERE id = $1', [mediaId]);

        // Try to delete the file from uploads folder if it's a local file
        try {
            if (media.url && media.url.includes('/uploads/')) {
                const filename = media.url.split('/uploads/')[1];
                const filePath = path.join(process.cwd(), 'uploads', filename);

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('✅ Deleted file:', filename);
                }
            }
        } catch (fileError) {
            console.error('⚠️ Could not delete file:', fileError);
            // Continue even if file deletion fails
        }

        res.json({
            success: true,
            message: 'تم حذف الوسائط بنجاح'
        });
    } catch (error) {
        console.error('❌ Delete diagnosis media error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء حذف الوسائط' });
    }
};


/**
 * Delete a diagnosis system (Admin/Supervisor Only)
 * @route DELETE /api/diagnosis/systems/:id
 */
export const deleteDiagnosisSystem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const pool = getPool();
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Get all items in this system
            const itemsResult = await client.query('SELECT id FROM diagnosis_items WHERE system_id = $1', [id]);
            const itemIds = itemsResult.rows.map(item => item.id);

            // 2. Delete media for these items (Cleanup files if needed, here just DB delete for simplicity, ideally should delete files too)
            if (itemIds.length > 0) {
                await client.query('DELETE FROM diagnosis_media WHERE item_id = ANY($1)', [itemIds]);
            }

            // 3. Delete items
            await client.query('DELETE FROM diagnosis_items WHERE system_id = $1', [id]);

            // 4. Delete system
            await client.query('DELETE FROM diagnosis_systems WHERE id = $1', [id]);

            await client.query('COMMIT');

            res.json({ success: true, message: 'تم حذف النظام بنجاح' });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Delete system error:', error);
        res.status(500).json({ success: false, message: 'فشل في حذف النظام' });
    }
};

/**
 * Delete a diagnosis item (Admin/Supervisor Only)
 * @route DELETE /api/diagnosis/systems/items/:id
 */
export const deleteDiagnosisItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const pool = getPool();
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Delete associated media
            await client.query('DELETE FROM diagnosis_media WHERE item_id = $1', [id]);

            // 2. Delete item
            await client.query('DELETE FROM diagnosis_items WHERE id = $1', [id]);

            await client.query('COMMIT');

            res.json({ success: true, message: 'تم حذف عنصر الفحص بنجاح' });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Delete item error:', error);
        res.status(500).json({ success: false, message: 'فشل في حذف عنصر الفحص' });
    }
};
