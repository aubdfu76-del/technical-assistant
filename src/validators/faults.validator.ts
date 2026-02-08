import { body, param } from 'express-validator';

/**
 * Validation rules for creating a new fault
 */
export const createFaultValidation = [
    body('vehicle_id')
        .isInt({ min: 1 })
        .withMessage('معرف المعدة مطلوب ويجب أن يكون رقم صحيح'),

    body('fault_code')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('رمز العطل يجب ألا يتجاوز 50 حرف'),

    body('title')
        .trim()
        .notEmpty()
        .withMessage('عنوان العطل مطلوب')
        .isLength({ min: 3, max: 255 })
        .withMessage('عنوان العطل يجب أن يكون بين 3 و 255 حرف'),

    body('description')
        .trim()
        .notEmpty()
        .withMessage('وصف العطل مطلوب')
        .isLength({ min: 10 })
        .withMessage('وصف العطل يجب أن يكون 10 أحرف على الأقل'),

    body('severity')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('الخطورة يجب أن تكون: low, medium, high, أو critical'),

    body('category')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('الفئة يجب ألا تتجاوز 100 حرف'),

    body('system_affected')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('النظام المتأثر يجب ألا يتجاوز 100 حرف'),
];

/**
 * Validation rules for updating a fault
 */
export const updateFaultValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('معرف العطل غير صحيح'),

    body('fault_code')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('رمز العطل يجب ألا يتجاوز 50 حرف'),

    body('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 255 })
        .withMessage('عنوان العطل يجب أن يكون بين 3 و 255 حرف'),

    body('description')
        .optional()
        .trim()
        .isLength({ min: 10 })
        .withMessage('وصف العطل يجب أن يكون 10 أحرف على الأقل'),

    body('severity')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('الخطورة يجب أن تكون: low, medium, high, أو critical'),

    body('category')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('الفئة يجب ألا تتجاوز 100 حرف'),

    body('system_affected')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('النظام المتأثر يجب ألا يتجاوز 100 حرف'),
];

/**
 * Validation rules for fault ID parameter
 */
export const faultIdValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('معرف العطل غير صحيح'),
];

/**
 * Validation rules for updating fault status
 */
export const updateFaultStatusValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('معرف العطل غير صحيح'),

    body('status')
        .isIn(['open', 'in_progress', 'resolved', 'closed'])
        .withMessage('الحالة يجب أن تكون: open, in_progress, resolved, أو closed'),
];

/**
 * Validation rules for resolving a fault
 */
export const resolveFaultValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('معرف العطل غير صحيح'),

    body('resolution_notes')
        .trim()
        .notEmpty()
        .withMessage('ملاحظات الحل مطلوبة')
        .isLength({ min: 10 })
        .withMessage('ملاحظات الحل يجب أن تكون 10 أحرف على الأقل'),
];
