import { Request, Response } from 'express';
import { getPool } from '../config/database';

console.log('📦 Repair Controller Loaded');


/**
 * Get all repair tasks for the technician with search support
 * @route GET /api/repair/tasks
 */
export const getRepairTasks = async (req: Request, res: Response) => {
    try {
        const { search, type, vehicle_id } = req.query; // type can be 'repair' or 'maintenance'
        console.log(`🔍 getRepairTasks called. Query: ${search}, Type: ${type}, Vehicle: ${vehicle_id}`);
        const pool = getPool();

        let query = 'SELECT * FROM repair_tasks WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;

        if (type) {
            query += ` AND task_type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        // Updated Vehicle Filter:
        // Show if vehicle_ids is empty/null (Global) OR if vehicle_id is explicitly in the list.
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
            // Find allowed vehicles first
            const allowed = await pool.query('SELECT vehicle_id FROM user_vehicle_allocations WHERE user_id = $1', [currentUser.userId]);
            const allowedIds = allowed.rows.map(r => r.vehicle_id);

            if (allowedIds.length === 0) {
                // No access to any vehicle -> return empty
                return res.json({ success: true, data: [] });
            }

            // Query: Tasks where vehicle_ids overlaps with allowedIds
            query += ` AND (
                vehicle_ids && $${paramIndex}::integer[]
            )`;
            params.push(allowedIds);
            paramIndex++;
        }

        if (search) {
            query += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR category ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('❌ Get repair tasks error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب مهام الإصلاح' });
    }
};

/**
 * Get repair task details with steps and media
 * @route GET /api/repair/tasks/:id
 */
export const getRepairTaskDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const taskResult = await pool.query('SELECT * FROM repair_tasks WHERE id = $1', [id]);
        if (taskResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'مهمة الإصلاح غير موجودة' });
        }

        // Get steps and their media
        const stepsResult = await pool.query(`
            SELECT s.*, 
                   (SELECT json_agg(m.*) FROM repair_media m WHERE m.step_id = s.id) as media
            FROM repair_steps s
            WHERE s.task_id = $1
            ORDER BY s.step_number ASC
        `, [id]);

        // Get task-level media
        const taskMediaResult = await pool.query('SELECT * FROM repair_media WHERE task_id = $1 AND step_id IS NULL ORDER BY order_index ASC, id ASC', [id]);

        res.json({
            success: true,
            data: {
                ...taskResult.rows[0],
                steps: stepsResult.rows,
                taskMedia: taskMediaResult.rows || []
            }
        });
    } catch (error) {
        console.error('❌ Get repair task details error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب تفاصيل حزمة الإصلاح' });
    }
};

/**
 * Create a new repair task (Admin/Supervisor Only)
 * @route POST /api/repair/tasks
 */
export const createRepairTask = async (req: Request, res: Response) => {
    try {
        const { title, description, category, difficulty, estimated_time, safety_procedures, workshop_requirements, technicians_count, required_tools, task_type, vehicle_ids } = req.body;
        console.log('📝 Received create repair task request:', req.body);
        const pool = getPool();

        // Default to global if no vehicle_ids, OR empty array.
        // Ensure vehicle_ids is array of integers
        const vIds = Array.isArray(vehicle_ids) ? vehicle_ids : [];

        // Check permissions for Trainer
        const currentUser = (req as any).user;
        if (currentUser.role === 'trainer') {
            if (vIds.length === 0) {
                // If no vehicles specified (global task), Trainer CANNOT create it.
                // Trainer must assign to specific vehicle(s).
                return res.status(403).json({ success: false, message: 'المدرب يجب أن يحدد مركبة واحدة على الأقل من المركبات المخصصة له' });
            }

            const allowed = await pool.query('SELECT vehicle_id FROM user_vehicle_allocations WHERE user_id = $1', [currentUser.userId]);
            const allowedIds = allowed.rows.map(r => r.vehicle_id);

            // Check if all requested vIds are in allowedIds
            const isAllowed = vIds.every((vid: number) => allowedIds.includes(vid));
            if (!isAllowed) {
                return res.status(403).json({ success: false, message: 'ليس لديك صلاحية لإضافة مهام لبعض المركبات المختارة' });
            }
        }

        const result = await pool.query(
            `INSERT INTO repair_tasks (title, description, category, difficulty, estimated_time, safety_procedures, workshop_requirements, technicians_count, required_tools, task_type, vehicle_ids)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [title, description, category, difficulty || 'medium', estimated_time, safety_procedures, workshop_requirements, technicians_count || 1, required_tools, task_type || 'repair', vIds]
        );

        console.log('✅ Repair task created successfully:', result.rows[0].id);
        res.status(201).json({
            success: true,
            message: 'تم إضافة مهمة الإصلاح بنجاح',
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('❌ Create repair task error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء إضافة مهمة الإصلاح: ' + error.message });
    }
};

/**
 * Update an existing repair task (Admin/Supervisor Only)
 * @route PUT /api/repair/tasks/:id
 */
export const updateRepairTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, category, difficulty, estimated_time, safety_procedures, workshop_requirements, technicians_count, required_tools } = req.body;
        const pool = getPool();

        const result = await pool.query(
            `UPDATE repair_tasks 
             SET title = $1, description = $2, category = $3, difficulty = $4, estimated_time = $5, 
                 safety_procedures = $6, workshop_requirements = $7, technicians_count = $8, required_tools = $9,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $10 RETURNING *`,
            [title, description, category, difficulty, estimated_time, safety_procedures, workshop_requirements, technicians_count, required_tools, id]
        );

        if (result.rowCount === 0) {
            console.log('⚠️ Repair task not found for update, ID:', id);
            return res.status(404).json({ success: false, message: 'مهمة الإصلاح غير موجودة' });
        }

        console.log('✅ Repair task updated successfully:', id);
        res.json({
            success: true,
            message: 'تم تحديث مهمة الإصلاح بنجاح',
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('❌ Update repair task error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث مهمة الإصلاح: ' + error.message });
    }
};

/**
 * Add media to a repair task
 * @route POST /api/repair/tasks/:id/media
 */
export const addRepairMedia = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { type, url } = req.body;
        const pool = getPool();

        const result = await pool.query(
            `INSERT INTO repair_media (task_id, media_type, url)
             VALUES ($1, $2, $3) RETURNING *`,
            [id, type, url]
        );

        res.status(201).json({
            success: true,
            message: 'تم إضافة الوسائط بنجاح',
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('❌ Add repair media error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء إضافة الوسائط' });
    }
};
/**
 * Delete repair media
 * @route DELETE /api/repair/media/:mediaId
 */
export const deleteRepairMedia = async (req: Request, res: Response) => {
    try {
        const { mediaId } = req.params;
        console.log(`🗑️ DELETE Request for Media ID: ${mediaId}`);
        const pool = getPool();

        const result = await pool.query('DELETE FROM repair_media WHERE id = $1 RETURNING *', [mediaId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'الوسائط غير موجودة' });
        }

        res.json({ success: true, message: 'تم حذف الوسائط بنجاح' });
    } catch (error: any) {
        console.error('❌ Delete repair media error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء حذف الوسائط' });
    }
};

/**
 * Reorder repair media
 * @route PUT /api/repair/media/:mediaId/order
 */
export const reorderRepairMedia = async (req: Request, res: Response) => {
    try {
        const { mediaId } = req.params;
        const { newIndex } = req.body;
        const pool = getPool();

        // 1. Get current media to know task_id
        const current = await pool.query('SELECT * FROM repair_media WHERE id = $1', [mediaId]);
        if (current.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'الوسائط غير موجودة' });
        }
        const media = current.rows[0];
        const taskId = media.task_id;

        // 2. Simply update the order_index
        await pool.query('UPDATE repair_media SET order_index = $1 WHERE id = $2', [newIndex, mediaId]);

        res.json({ success: true, message: 'تم تحديث الترتيب بنجاح' });
    } catch (error: any) {
        console.error('❌ Reorder repair media error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء تغيير الترتيب' });
    }
};

/**
 * Get maintenance sections
 * @route GET /api/maintenance/sections
 */
export const getMaintenanceSections = async (req: Request, res: Response) => {
    try {
        const { vehicle_id } = req.query;
        const pool = getPool();

        let query = 'SELECT * FROM maintenance_sections';
        const params: any[] = [];

        if (vehicle_id) {
            // Allow global (empty/null) OR specific
            query += ` WHERE (
                vehicle_ids IS NULL 
                OR cardinality(vehicle_ids) = 0 
                OR $1 = ANY(vehicle_ids)
                OR $1 = ANY(vehicle_ids)
            )`;
            params.push(parseInt(vehicle_id as string));
        }

        // Trainer restriction
        const currentUser = (req as any).user;
        if (currentUser && currentUser.role === 'trainer') {
            const allowed = await pool.query('SELECT vehicle_id FROM user_vehicle_allocations WHERE user_id = $1', [currentUser.userId]);
            const allowedIds = allowed.rows.map(r => r.vehicle_id);

            if (allowedIds.length === 0) {
                return res.json({ success: true, data: [] });
            }

            // Filter sections that match allowed vehicles
            // Assuming query has WHERE clause already if vehicle_id was present, or we need to check if it has WHERE or not.
            // My previous code:
            // let query = 'SELECT * FROM maintenance_sections';
            // if (vehicle_id) query += ' WHERE ...'

            // So if vehicle_id was present, we append AND. If not, we append WHERE.
            const prefix = vehicle_id ? ' AND ' : ' WHERE ';

            // Need to match param index
            const pIdx = vehicle_id ? 2 : 1;

            query += `${prefix} (
                vehicle_ids && $${pIdx}::integer[]
             )`;
            params.push(allowedIds);
        }

        query += ' ORDER BY created_at ASC';

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('❌ Get sections error:', error);
        res.status(500).json({ success: false, message: 'فشل في جلب الأقسام' });
    }
};

/**
 * Create maintenance section
 * @route POST /api/maintenance/sections
 */
export const createMaintenanceSection = async (req: Request, res: Response) => {
    try {
        const { title, description, icon, color, vehicle_ids } = req.body;
        console.log('📝 Create Section Request:', { title, description, icon, color, vehicle_ids });

        if (!title) {
            return res.status(400).json({ success: false, message: 'عنوان القسم مطلوب' });
        }

        const pool = getPool();
        const key_id = 'custom_' + Date.now();
        const vIds = Array.isArray(vehicle_ids) ? vehicle_ids : [];

        // Check permissions for Trainer
        const currentUser = (req as any).user;
        if (currentUser.role === 'trainer') {
            if (vIds.length === 0) {
                return res.status(403).json({ success: false, message: 'المدرب يجب أن يحدد مركبة واحدة على الأقل' });
            }
            const allowed = await pool.query('SELECT vehicle_id FROM user_vehicle_allocations WHERE user_id = $1', [currentUser.userId]);
            const allowedIds = allowed.rows.map(r => r.vehicle_id);
            const isAllowed = vIds.every((vid: number) => allowedIds.includes(vid));
            if (!isAllowed) {
                return res.status(403).json({ success: false, message: 'ليس لديك صلاحية لإضافة أقسام لبعض المركبات المختارة' });
            }
        }

        const result = await pool.query(
            'INSERT INTO maintenance_sections (key_id, title, icon, color, description, vehicle_ids) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [key_id, title, icon || 'Wrench', color || '107, 114, 128', description, vIds]
        );

        console.log('✅ Section created:', result.rows[0]);
        res.status(201).json({ success: true, data: result.rows[0], message: 'تم إضافة القسم بنجاح' });
    } catch (error) {
        console.error('❌ Create section error:', error);
        res.status(500).json({ success: false, message: 'فشل في إنشاء القسم' });
    }
};

/**
 * Reorder repair media batch
 * @route POST /api/repair/media/reorder-batch
 */
export const reorderRepairMediaBatch = async (req: Request, res: Response) => {
    // ... existing implementation
    try {
        const { updates } = req.body; // Expect array of { id: number, order_index: number }
        const pool = getPool();

        if (!Array.isArray(updates)) {
            return res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const item of updates) {
                await client.query('UPDATE repair_media SET order_index = $1 WHERE id = $2', [item.order_index, item.id]);
            }
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

        res.json({ success: true, message: 'تم تحديث الترتيب بنجاح' });
    } catch (error: any) {
        console.error('❌ Reorder batch repair media error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء تغيير الترتيب' });
    }
};

/**
 * Delete a repair task
 * @route DELETE /api/repair/tasks/:id
 */
export const deleteRepairTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const pool = getPool();
        const client = await pool.connect();

        console.log(`🗑️ Attempting to delete task ${id}`);

        try {
            // 1. Get task details first to check permissions
            const taskCheck = await client.query('SELECT vehicle_ids FROM repair_tasks WHERE id = $1', [id]);
            if (taskCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'المهمة غير موجودة' });
            }

            // Trainer restriction check
            const currentUser = (req as any).user;
            if (currentUser.role === 'trainer') {
                const taskVehicles = taskCheck.rows[0].vehicle_ids || [];
                const allowed = await client.query('SELECT vehicle_id FROM user_vehicle_allocations WHERE user_id = $1', [currentUser.userId]);
                const allowedIds = allowed.rows.map(r => r.vehicle_id);

                // If task has NO vehicles (global), trainer cannot delete? Or if task has vehicles not in allowed list?
                // Logic: Trainer can only delete if ALL task vehicles are within their allowed list?
                // Or if at least one?
                // Safer: If task is specific to vehicles, Trainer must have access to ALL of them to delete.
                // If task is Global (empty ids), Trainer cannot delete.
                if (taskVehicles.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ success: false, message: 'لا يمكنك حذف مهام عامة' });
                }

                const hasAccess = taskVehicles.every((vid: number) => allowedIds.includes(vid));
                if (!hasAccess) {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ success: false, message: 'ليس لديك صلاحية لحذف هذه المهمة لأنها مرتبطة بمركبات غير مخصصة لك' });
                }
            }

            // 1. Delete associated media
            await client.query('DELETE FROM repair_media WHERE task_id = $1', [id]);

            // 2. Delete associated steps
            await client.query('DELETE FROM repair_steps WHERE task_id = $1', [id]);

            // 3. Delete the task
            await client.query('DELETE FROM repair_tasks WHERE id = $1', [id]);

            await client.query('COMMIT');
            console.log(`✅ Task ${id} deleted successfully`);
            res.json({ success: true, message: 'تم حذف المهمة بنجاح' });
        } catch (e: any) {
            await client.query('ROLLBACK');
            console.error('❌ SQL Transaction Error:', e);

            // Log to file for inspection
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(process.cwd(), 'delete_error.log');
            const logMsg = `${new Date().toISOString()} - Delete Task ${id} Failed: ${e.message}\nStack: ${e.stack}\n\n`;
            try { fs.appendFileSync(logPath, logMsg); } catch (err) { }

            throw e;
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('❌ Delete repair task error:', error);
        res.status(500).json({ success: false, message: 'فشل في حذف المهمة: ' + (error.message || 'خطأ غير معروف') });
    }
};

/**
 * Delete maintenance section and its tasks
 * @route DELETE /api/maintenance/sections/:id
 */
export const deleteMaintenanceSection = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const pool = getPool();
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Get section title (category) and vehicle_ids
            const sectionResult = await client.query('SELECT title, vehicle_ids FROM maintenance_sections WHERE id = $1', [id]);
            if (sectionResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'القسم غير موجود' });
            }
            const section = sectionResult.rows[0];
            const sectionTitle = section.title;

            // Trainer restriction check
            const currentUser = (req as any).user;
            if (currentUser.role === 'trainer') {
                const sectionVehicles = section.vehicle_ids || [];
                const allowed = await client.query('SELECT vehicle_id FROM user_vehicle_allocations WHERE user_id = $1', [currentUser.userId]);
                const allowedIds = allowed.rows.map(r => r.vehicle_id);

                if (sectionVehicles.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ success: false, message: 'لا يمكنك حذف أقسام عامة' });
                }

                const hasAccess = sectionVehicles.every((vid: number) => allowedIds.includes(vid));
                if (!hasAccess) {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ success: false, message: 'ليس لديك صلاحية لحذف هذا القسم لأنه مرتبط بمركبات غير مخصصة لك' });
                }
            }

            // Get IDs of all tasks in this category
            const tasksResult = await client.query('SELECT id FROM repair_tasks WHERE category = $1', [sectionTitle]);
            const taskIds = tasksResult.rows.map(row => row.id);

            if (taskIds.length > 0) {
                // Delete media for these tasks
                await client.query('DELETE FROM repair_media WHERE task_id = ANY($1)', [taskIds]);

                // Delete steps for these tasks
                await client.query('DELETE FROM repair_steps WHERE task_id = ANY($1)', [taskIds]);

                // Delete tasks
                await client.query('DELETE FROM repair_tasks WHERE id = ANY($1)', [taskIds]);
            }

            // Delete the section
            await client.query('DELETE FROM maintenance_sections WHERE id = $1', [id]);

            await client.query('COMMIT');
            res.json({ success: true, message: 'تم حذف القسم وجميع المهام المرتبطة به' });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Delete section error:', error);
        res.status(500).json({ success: false, message: 'فشل في حذف القسم' });
    }
};
