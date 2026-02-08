import { body, param, query } from 'express-validator';

/**
 * Validation rules for creating a new vehicle
 */
export const createVehicleValidation = [
    body('plate_number')
        .trim()
        .notEmpty()
        .withMessage('رقم المعدة مطلوب')
        .isLength({ min: 2, max: 50 })
        .withMessage('رقم المعدة يجب أن يكون بين 2 و 50 حرف'),

    body('vehicle_type')
        .trim()
        .notEmpty()
        .withMessage('نوع المعدة مطلوب')
        .isLength({ min: 2, max: 100 })
        .withMessage('نوع المعدة يجب أن يكون بين 2 و 100 حرف'),

    body('model')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('الموديل يجب ألا يتجاوز 100 حرف'),

    body('manufacturer')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('الشركة المصنعة يجب ألا تتجاوز 100 حرف'),

    body('year')
        .optional()
        .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
        .withMessage(`السنة يجب أن تكون بين 1900 و ${new Date().getFullYear() + 1}`),

    body('vin')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('رقم الهيكل يجب ألا يتجاوز 100 حرف'),

    body('current_km')
        .optional()
        .isInt({ min: 0 })
        .withMessage('عدد الكيلومترات يجب أن يكون رقم موجب'),

    body('engine_type')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('نوع المحرك يجب ألا يتجاوز 100 حرف'),

    body('fuel_type')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('نوع الوقود يجب ألا يتجاوز 50 حرف'),

    body('status')
        .optional()
        .isIn(['active', 'inactive', 'maintenance', 'retired'])
        .withMessage('الحالة يجب أن تكون: active, inactive, maintenance, أو retired'),

    body('next_maintenance_km')
        .optional()
        .isInt({ min: 0 })
        .withMessage('كيلومترات الصيانة القادمة يجب أن تكون رقم موجب'),

    body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('الملاحظات يجب ألا تتجاوز 1000 حرف'),
];

/**
 * Validation rules for updating a vehicle
 */
export const updateVehicleValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('معرف المعدة غير صحيح'),

    body('plate_number')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('رقم المعدة يجب أن يكون بين 2 و 50 حرف'),

    body('vehicle_type')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('نوع المعدة يجب أن يكون بين 2 و 100 حرف'),

    body('model')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('الموديل يجب ألا يتجاوز 100 حرف'),

    body('manufacturer')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('الشركة المصنعة يجب ألا تتجاوز 100 حرف'),

    body('year')
        .optional()
        .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
        .withMessage(`السنة يجب أن تكون بين 1900 و ${new Date().getFullYear() + 1}`),

    body('vin')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('رقم الهيكل يجب ألا يتجاوز 100 حرف'),

    body('current_km')
        .optional()
        .isInt({ min: 0 })
        .withMessage('عدد الكيلومترات يجب أن يكون رقم موجب'),

    body('engine_type')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('نوع المحرك يجب ألا يتجاوز 100 حرف'),

    body('fuel_type')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('نوع الوقود يجب ألا يتجاوز 50 حرف'),

    body('status')
        .optional()
        .isIn(['active', 'inactive', 'maintenance', 'retired'])
        .withMessage('الحالة يجب أن تكون: active, inactive, maintenance, أو retired'),

    body('next_maintenance_km')
        .optional()
        .isInt({ min: 0 })
        .withMessage('كيلومترات الصيانة القادمة يجب أن تكون رقم موجب'),

    body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('الملاحظات يجب ألا تتجاوز 1000 حرف'),
];

/**
 * Validation rules for vehicle ID parameter
 */
export const vehicleIdValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('معرف المعدة غير صحيح'),
];

/**
 * Validation rules for updating vehicle status
 */
export const updateVehicleStatusValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('معرف المعدة غير صحيح'),

    body('status')
        .isIn(['active', 'inactive', 'maintenance', 'retired'])
        .withMessage('الحالة يجب أن تكون: active, inactive, maintenance, أو retired'),
];

/**
 * Validation rules for updating vehicle kilometers
 */
export const updateVehicleKmValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('معرف المعدة غير صحيح'),

    body('current_km')
        .isInt({ min: 0 })
        .withMessage('عدد الكيلومترات يجب أن يكون رقم موجب'),
];
