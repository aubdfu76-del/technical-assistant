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
