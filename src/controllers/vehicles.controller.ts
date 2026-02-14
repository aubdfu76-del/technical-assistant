import { Request, Response } from 'express';
import { getPool } from '../config/database';

/**
 * Get all vehicles with pagination and filtering
 * @route GET /api/vehicles
 * @access Private (all authenticated users)
 */
export const getVehicles = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status as string;
        const vehicle_type = req.query.vehicle_type as string;
        const search = req.query.search as string;

        const pool = getPool();

        // Build query
        let query = `
            SELECT 
                id, plate_number, equipment_name, vehicle_type, model, manufacturer, year, vin,
                current_km, engine_type, fuel_type, status, last_maintenance_date,
                next_maintenance_km, image_url, notes, created_at, updated_at
            FROM vehicles
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        // Add status filter
        if (status && ['active', 'inactive', 'maintenance', 'retired'].includes(status)) {
            query += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        // Add vehicle_type filter
        if (vehicle_type) {
            query += ` AND vehicle_type ILIKE $${paramIndex}`;
            params.push(`%${vehicle_type}%`);
            paramIndex++;
        }

        // Add search filter
        if (search) {
            query += ` AND (
                plate_number ILIKE $${paramIndex} OR 
                equipment_name ILIKE $${paramIndex} OR 
                vehicle_type ILIKE $${paramIndex} OR 
                model ILIKE $${paramIndex} OR
                manufacturer ILIKE $${paramIndex}
            )`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM (${query}) as filtered_vehicles`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Add pagination
        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        // Execute query
        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });

        console.log(`✅ Retrieved ${result.rows.length} vehicles (page ${page})`);
    } catch (error) {
        console.error('❌ Get vehicles error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب المعدات',
        });
    }
};

/**
 * Get vehicle by ID
 * @route GET /api/vehicles/:id
 * @access Private (all authenticated users)
 */
export const getVehicleById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const pool = getPool();
        const result = await pool.query(
            `SELECT 
                id, plate_number, equipment_name, vehicle_type, model, manufacturer, year, vin,
                current_km, engine_type, fuel_type, status, last_maintenance_date,
                next_maintenance_km, image_url, notes, created_at, updated_at
            FROM vehicles 
            WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المعدة غير موجودة',
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
        });

        console.log(`✅ Retrieved vehicle: ${result.rows[0].plate_number}`);
    } catch (error) {
        console.error('❌ Get vehicle by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب بيانات المعدة',
        });
    }
};

/**
 * Create new vehicle
 * @route POST /api/vehicles
 * @access Private (admin, supervisor)
 */
export const createVehicle = async (req: Request, res: Response) => {
    try {
        const {
            plate_number,
            equipment_name,
            vehicle_type,
            model,
            manufacturer,
            year,
            vin,
            current_km,
            engine_type,
            fuel_type,
            status,
            next_maintenance_km,
            image_url,
            notes,
        } = req.body;

        console.log('📝 Create vehicle request received:', {
            plate_number,
            equipment_name,
            vehicle_type,
            model,
            manufacturer,
            year
        });

        // Validation: plate_number is required
        if (!plate_number || plate_number.trim() === '') {
            console.log('❌ Validation failed: plate_number is empty');
            return res.status(400).json({
                success: false,
                message: 'رقم المعدة مطلوب',
            });
        }

        const pool = getPool();

        // Check if plate_number already exists
        const existingVehicle = await pool.query(
            'SELECT id FROM vehicles WHERE plate_number = $1',
            [plate_number]
        );

        if (existingVehicle.rows.length > 0) {
            console.log('❌ Duplicate plate_number:', plate_number);
            return res.status(409).json({
                success: false,
                message: 'رقم المعدة مستخدم بالفعل',
            });
        }

        // Insert vehicle
        const result = await pool.query(
            `INSERT INTO vehicles (
                plate_number, equipment_name, vehicle_type, model, manufacturer, year, vin,
                current_km, engine_type, fuel_type, status, next_maintenance_km, image_url, notes
            )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             RETURNING *`,
            [
                plate_number,
                equipment_name || null,
                vehicle_type,
                model || null,
                manufacturer || null,
                year || null,
                vin || null,
                current_km || 0,
                engine_type || null,
                fuel_type || null,
                status || 'active',
                next_maintenance_km || null,
                image_url || null,
                notes || null,
            ]
        );

        res.status(201).json({
            success: true,
            message: 'تم إنشاء المعدة بنجاح',
            data: result.rows[0],
        });

        console.log(`✅ Created vehicle: ${plate_number} (${vehicle_type})`);
    } catch (error: any) {
        console.error('❌ Create vehicle error:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            detail: error.detail
        });

        if (error.code === '23505') { // Unique violation
            return res.status(409).json({
                success: false,
                message: 'رقم المعدة مستخدم بالفعل',
            });
        }

        // More detailed error message
        let errorMessage = 'حدث خطأ أثناء إنشاء المعدة';
        if (error.code === '23502') { // NOT NULL violation
            errorMessage = 'بعض الحقول المطلوبة فارغة';
        } else if (error.code === '22P02') { // Invalid input syntax
            errorMessage = 'صيغة البيانات المدخلة غير صحيحة';
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update vehicle
 * @route PUT /api/vehicles/:id
 * @access Private (admin, supervisor)
 */
export const updateVehicle = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const pool = getPool();

        // Check if vehicle exists
        const existingVehicle = await pool.query(
            'SELECT id FROM vehicles WHERE id = $1',
            [id]
        );

        if (existingVehicle.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المعدة غير موجودة',
            });
        }

        // Check for duplicate plate_number (if changing)
        if (updateData.plate_number) {
            const duplicate = await pool.query(
                'SELECT id FROM vehicles WHERE plate_number = $1 AND id != $2',
                [updateData.plate_number, id]
            );

            if (duplicate.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'رقم المعدة مستخدم بالفعل',
                });
            }
        }

        // Build update query dynamically
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        const allowedFields = [
            'plate_number', 'equipment_name', 'vehicle_type', 'model', 'manufacturer', 'year',
            'vin', 'current_km', 'engine_type', 'fuel_type', 'status',
            'next_maintenance_km', 'image_url', 'notes'
        ];

        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                updates.push(`${field} = $${paramIndex}`);
                values.push(updateData[field] || null);
                paramIndex++;
            }
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
            `UPDATE vehicles 
             SET ${updates.join(', ')}
             WHERE id = $${paramIndex}
             RETURNING *`,
            values
        );

        res.json({
            success: true,
            message: 'تم تحديث المعدة بنجاح',
            data: result.rows[0],
        });

        console.log(`✅ Updated vehicle: ${result.rows[0].plate_number}`);
    } catch (error: any) {
        console.error('❌ Update vehicle error:', error);

        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'رقم المعدة مستخدم بالفعل',
            });
        }

        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء تحديث المعدة',
        });
    }
};

/**
 * Delete vehicle
 * @route DELETE /api/vehicles/:id
 * @access Private (admin only)
 */
export const deleteVehicle = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const pool = getPool();

        // Check if vehicle exists
        const existingVehicle = await pool.query(
            'SELECT plate_number FROM vehicles WHERE id = $1',
            [id]
        );

        if (existingVehicle.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المعدة غير موجودة',
            });
        }



        // Delete vehicle
        await pool.query('DELETE FROM vehicles WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'تم حذف المعدة بنجاح',
        });

        console.log(`✅ Deleted vehicle: ${existingVehicle.rows[0].plate_number}`);
    } catch (error) {
        console.error('❌ Delete vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء حذف المعدة',
        });
    }
};

/**
 * Update vehicle status
 * @route PATCH /api/vehicles/:id/status
 * @access Private (admin, supervisor)
 */
export const updateVehicleStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const pool = getPool();

        const result = await pool.query(
            `UPDATE vehicles 
             SET status = $1
             WHERE id = $2
             RETURNING id, plate_number, vehicle_type, status`,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المعدة غير موجودة',
            });
        }

        res.json({
            success: true,
            message: 'تم تحديث حالة المعدة بنجاح',
            data: result.rows[0],
        });

        console.log(`✅ Updated vehicle status: ${result.rows[0].plate_number} -> ${status}`);
    } catch (error) {
        console.error('❌ Update vehicle status error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء تحديث حالة المعدة',
        });
    }
};

/**
 * Update vehicle kilometers
 * @route PATCH /api/vehicles/:id/km
 * @access Private (all authenticated users)
 */
export const updateVehicleKm = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { current_km } = req.body;

        const pool = getPool();

        const result = await pool.query(
            `UPDATE vehicles 
             SET current_km = $1
             WHERE id = $2
             RETURNING id, plate_number, current_km, next_maintenance_km`,
            [current_km, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المعدة غير موجودة',
            });
        }

        res.json({
            success: true,
            message: 'تم تحديث عداد الكيلومترات بنجاح',
            data: result.rows[0],
        });

        console.log(`✅ Updated vehicle km: ${result.rows[0].plate_number} -> ${current_km} km`);
    } catch (error) {
        console.error('❌ Update vehicle km error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء تحديث عداد الكيلومترات',
        });
    }
};

/**
 * Get vehicle statistics
 * @route GET /api/vehicles/:id/stats
 * @access Private (all authenticated users)
 */
export const getVehicleStats = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const pool = getPool();

        // Get vehicle stats from view
        const result = await pool.query(
            'SELECT * FROM vw_vehicle_stats WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المعدة غير موجودة',
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
        });

        console.log(`✅ Retrieved stats for vehicle: ${result.rows[0].plate_number}`);
    } catch (error) {
        console.error('❌ Get vehicle stats error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب إحصائيات المعدة',
        });
    }
};

/**
 * Get vehicle faults
 * @route GET /api/vehicles/:id/faults
 * @access Private (all authenticated users)
 */
export const getVehicleFaults = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const status = req.query.status as string;

        const pool = getPool();

        // Check if vehicle exists
        const vehicleCheck = await pool.query(
            'SELECT id FROM vehicles WHERE id = $1',
            [id]
        );

        if (vehicleCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المعدة غير موجودة',
            });
        }

        // Build query
        let query = `
            SELECT 
                f.*,
                u.full_name as reported_by_name,
                u.employee_id as reported_by_id
            FROM faults f
            LEFT JOIN users u ON f.reported_by = u.id
            WHERE f.vehicle_id = $1
        `;
        const params: any[] = [id];

        // Add status filter if provided
        if (status) {
            query += ` AND f.status = $2`;
            params.push(status);
        }

        query += ` ORDER BY f.reported_at DESC`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
        });

        console.log(`✅ Retrieved ${result.rows.length} faults for vehicle ID: ${id}`);
    } catch (error) {
        console.error('❌ Get vehicle faults error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب أعطال المعدة',
        });
    }
};

/**
 * Get vehicle maintenance tasks
 * @route GET /api/vehicles/:id/maintenance
 * @access Private (all authenticated users)
 */
export const getVehicleMaintenance = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const status = req.query.status as string;

        const pool = getPool();

        // Check if vehicle exists
        const vehicleCheck = await pool.query(
            'SELECT id FROM vehicles WHERE id = $1',
            [id]
        );

        if (vehicleCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المعدة غير موجودة',
            });
        }

        // Build query
        let query = `
            SELECT 
                m.*,
                u.full_name as assigned_to_name,
                u.employee_id as assigned_to_id
            FROM maintenance_tasks m
            LEFT JOIN users u ON m.assigned_to = u.id
            WHERE m.vehicle_id = $1
        `;
        const params: any[] = [id];

        // Add status filter if provided
        if (status) {
            query += ` AND m.status = $2`;
            params.push(status);
        }

        query += ` ORDER BY m.scheduled_date DESC`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
        });

        console.log(`✅ Retrieved ${result.rows.length} maintenance tasks for vehicle ID: ${id}`);
    } catch (error) {
        console.error('❌ Get vehicle maintenance error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب مهام صيانة المعدة',
        });
    }
};
