import { Request, Response } from 'express';
import { getPool } from '../config/database';

/**
 * Get vehicle specifications
 * @route GET /api/vehicles/:id/specs
 * @access Private (all authenticated users)
 */
export const getVehicleSpecs = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const result = await pool.query(
            'SELECT * FROM vehicle_specifications WHERE vehicle_id = $1',
            [id]
        );

        res.json({
            success: true,
            data: result.rows[0] || null,
        });
    } catch (error) {
        console.error('❌ Get vehicle specs error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching vehicle specifications',
        });
    }
};

/**
 * Add or Update vehicle specifications
 * @route POST /api/vehicles/:id/specs
 * @access Private (admin, supervisor)
 */
export const upsertVehicleSpecs = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const specs = req.body;
        const pool = getPool();

        console.log('📝 Saving specs for vehicle:', id);
        console.log('📝 Specs data:', JSON.stringify(specs, null, 2));

        // Check if specs exist
        const check = await pool.query(
            'SELECT id FROM vehicle_specifications WHERE vehicle_id = $1',
            [id]
        );

        let query = '';
        let params: any[] = [];

        if (check.rows.length === 0) {
            // Insert
            query = `
                INSERT INTO vehicle_specifications (
                    vehicle_id, length, width, height, gross_weight, payload_capacity,
                    power_hp, torque_nm, engine_displacement, transmission_type,
                    fuel_tank_capacity, oil_capacity, tire_size, tire_pressure_psi, battery_voltage, custom_specs
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                RETURNING *
            `;
            params = [
                id,
                specs.length ?? null, specs.width ?? null, specs.height ?? null,
                specs.gross_weight ?? null, specs.payload_capacity ?? null,
                specs.power_hp ?? null, specs.torque_nm ?? null, specs.engine_displacement ?? null,
                specs.transmission_type ?? null,
                specs.fuel_tank_capacity ?? null, specs.oil_capacity ?? null,
                specs.tire_size ?? null, specs.tire_pressure_psi ?? null, specs.battery_voltage ?? null,
                JSON.stringify(specs.custom_specs || [])
            ];
        } else {
            // Update
            query = `
                UPDATE vehicle_specifications SET
                    length = $2, width = $3, height = $4, gross_weight = $5, payload_capacity = $6,
                    power_hp = $7, torque_nm = $8, engine_displacement = $9, transmission_type = $10,
                    fuel_tank_capacity = $11, oil_capacity = $12, tire_size = $13, tire_pressure_psi = $14, battery_voltage = $15,
                    custom_specs = $16,
                    updated_at = CURRENT_TIMESTAMP
                WHERE vehicle_id = $1
                RETURNING *
            `;
            params = [
                id,
                specs.length ?? null, specs.width ?? null, specs.height ?? null,
                specs.gross_weight ?? null, specs.payload_capacity ?? null,
                specs.power_hp ?? null, specs.torque_nm ?? null, specs.engine_displacement ?? null,
                specs.transmission_type ?? null,
                specs.fuel_tank_capacity ?? null, specs.oil_capacity ?? null,
                specs.tire_size ?? null, specs.tire_pressure_psi ?? null, specs.battery_voltage ?? null,
                JSON.stringify(specs.custom_specs || [])
            ];
        }

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Vehicle specifications saved successfully'
        });

    } catch (error: any) {
        console.error('❌ Upsert vehicle specs error:', error.message, error.stack);
        res.status(500).json({
            success: false,
            message: 'Error saving vehicle specifications: ' + error.message,
        });
    }
};
