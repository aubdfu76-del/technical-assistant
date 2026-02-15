// This function is to be appended to diagnosis.controller.ts

/**
 * Update a common fault (Admin/Supervisor/Trainer)
 * @route PUT /api/diagnosis/common/:id
 */
export const updateCommonFault = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, severity, category, recommended_system, symptoms, causes, vehicle_ids } = req.body;
        const currentUser = (req as any).user;
        const pool = getPool();
        const client = await pool.connect();
        const vIds = Array.isArray(vehicle_ids) ? vehicle_ids : [];

        try {
            await client.query('BEGIN');

            // 1. Check existence and permissions
            const currentFault = await client.query('SELECT * FROM common_faults WHERE id = $1', [id]);
            if (currentFault.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'العطل غير موجود' });
            }

            // Trainer Permission Check
            if (currentUser.role === 'trainer') {
                const currentVehicles = currentFault.rows[0].vehicle_ids || [];
                const allowed = await client.query('SELECT vehicle_id FROM user_vehicle_allocations WHERE user_id = $1', [currentUser.userId]);
                const allowedIds = allowed.rows.map(r => r.vehicle_id);

                // 1. Check if trainer has access to CURRENT vehicles of the fault
                // If the fault is global (empty/null), trainer CANNOT edit it.
                if (currentVehicles.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ success: false, message: 'لا يمكنك تعديل أعطال عامة' });
                }

                const hasAccessCurrent = currentVehicles.every((vid: number) => allowedIds.includes(vid));
                if (!hasAccessCurrent) {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ success: false, message: 'ليس لديك صلاحية لتعديل هذا العطل' });
                }

                // 2. Check if trainer has access to NEW vehicle_ids (if provided)
                if (vIds.length > 0) {
                    const hasAccessNew = vIds.every((vid: number) => allowedIds.includes(vid));
                    if (!hasAccessNew) {
                        await client.query('ROLLBACK');
                        return res.status(403).json({ success: false, message: 'لا يمكنك تعيين العطل لمركبات ليست من صلاحياتك' });
                    }
                } else {
                    // Trainer cannot make it global
                    await client.query('ROLLBACK');
                    return res.status(403).json({ success: false, message: 'المدرب يجب أن يحدد مركبة واحدة على الأقل' });
                }
            }

            // 2. Update Basic Info
            await client.query(
                `UPDATE common_faults 
                 SET title = $1, description = $2, severity = $3, category = $4, recommended_system = $5, vehicle_ids = $6, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $7`,
                [title, description, severity, category, recommended_system, vIds, id]
            );

            // 3. Update Symptoms (Delete all and re-insert)
            if (symptoms && Array.isArray(symptoms)) {
                await client.query('DELETE FROM fault_symptoms WHERE fault_id = $1', [id]);
                for (const symptom of symptoms) {
                    await client.query('INSERT INTO fault_symptoms (fault_id, description) VALUES ($1, $2)', [id, symptom]);
                }
            }

            // 4. Update Causes (Delete all and re-insert)
            if (causes && Array.isArray(causes)) {
                await client.query('DELETE FROM fault_causes WHERE fault_id = $1', [id]);
                for (const cause of causes) {
                    await client.query('INSERT INTO fault_causes (fault_id, description) VALUES ($1, $2)', [id, cause]);
                }
            }

            await client.query('COMMIT');
            res.json({ success: true, message: 'تم تحديث العطل بنجاح' });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Update common fault error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث العطل' });
    }
};
