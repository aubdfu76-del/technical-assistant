import express from 'express';
import {
    getVehicles,
    getVehicleById,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    updateVehicleStatus,
    updateVehicleKm,
    getVehicleStats,
    getVehicleFaults,
    getVehicleMaintenance,
} from '../controllers/vehicles.controller';
import {
    getVehicleSpecs,
    upsertVehicleSpecs
} from '../controllers/vehicle_specs.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
    createVehicleValidation,
    updateVehicleValidation,
    vehicleIdValidation,
    updateVehicleStatusValidation,
    updateVehicleKmValidation,
} from '../validators/vehicles.validator';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/vehicles
 * @desc    Get all vehicles with pagination and filtering
 * @access  Private (all authenticated users)
 */
router.get('/', getVehicles);

/**
 * @route   GET /api/vehicles/:id
 * @desc    Get vehicle by ID
 * @access  Private (all authenticated users)
 */
router.get('/:id',
    validate(vehicleIdValidation),
    getVehicleById
);

/**
 * @route   POST /api/vehicles
 * @desc    Create new vehicle
 * @access  Private (admin, supervisor)
 */
router.post('/',
    authorize('admin', 'supervisor', 'trainer'),
    validate(createVehicleValidation),
    createVehicle
);

/**
 * @route   PUT /api/vehicles/:id
 * @desc    Update vehicle
 * @access  Private (admin, supervisor)
 */
router.put('/:id',
    authorize('admin', 'supervisor', 'trainer'),
    validate(updateVehicleValidation),
    updateVehicle
);

/**
 * @route   DELETE /api/vehicles/:id
 * @desc    Delete vehicle
 * @access  Private (admin only)
 */
router.delete('/:id',
    authorize('admin', 'supervisor', 'trainer'),
    validate(vehicleIdValidation),
    deleteVehicle
);

/**
 * @route   PATCH /api/vehicles/:id/status
 * @desc    Update vehicle status
 * @access  Private (admin, supervisor)
 */
router.patch('/:id/status',
    authorize('admin', 'supervisor', 'trainer'),
    validate(updateVehicleStatusValidation),
    updateVehicleStatus
);

/**
 * @route   PATCH /api/vehicles/:id/km
 * @desc    Update vehicle kilometers
 * @access  Private (all authenticated users)
 */
router.patch('/:id/km',
    validate(updateVehicleKmValidation),
    updateVehicleKm
);

/**
 * @route   GET /api/vehicles/:id/specs
 * @desc    Get vehicle specifications
 * @access  Private (all authenticated users)
 */
router.get('/:id/specs',
    validate(vehicleIdValidation),
    getVehicleSpecs
);

/**
 * @route   POST /api/vehicles/:id/specs
 * @desc    Add or Update vehicle specifications
 * @access  Private (admin, supervisor)
 */
router.post('/:id/specs',
    authorize('admin', 'supervisor', 'trainer'),
    validate(vehicleIdValidation),
    upsertVehicleSpecs
);

/**
 * @route   GET /api/vehicles/:id/stats
 * @desc    Get vehicle statistics
 * @access  Private (all authenticated users)
 */
router.get('/:id/stats',
    validate(vehicleIdValidation),
    getVehicleStats
);

/**
 * @route   GET /api/vehicles/:id/faults
 * @desc    Get vehicle faults
 * @access  Private (all authenticated users)
 */
router.get('/:id/faults',
    validate(vehicleIdValidation),
    getVehicleFaults
);

/**
 * @route   GET /api/vehicles/:id/maintenance
 * @desc    Get vehicle maintenance tasks
 * @access  Private (all authenticated users)
 */
router.get('/:id/maintenance',
    validate(vehicleIdValidation),
    getVehicleMaintenance
);

export default router;
