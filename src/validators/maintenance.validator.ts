import { body, param } from 'express-validator';

/**
 * Validation rules for creating a new maintenance task
 */
export const createMaintenanceValidation = [
    body('vehicle_id')
        .isInt({ min: 1 })
        .withMessage('معرف المعدة مطلوب'),

    body('fault_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('معرف العطل المرتبط غير صحيح'),

    body('task_type')
        .trim()
        .notEmpty()
        .withMessage('نوع المهمة مطلوب')
        .isLength({ max: 100 }),

    body('title')
        .trim()
        .notEmpty()
        .withMessage('عنوان المهمة مطلوب')
        .isLength({ min: 3, max: 255 }),

    body('description')
        .optional()
        .trim(),

    body('priority')
        .optional()
        .isIn(['low', 'normal', 'high', 'urgent'])
        .withMessage('الأولوية غير صحيحة'),

    body('assigned_to')
        .optional()
        .isInt({ min: 1 })
        .withMessage('معرف الفني المكلف غير صحيح'),

    body('scheduled_date')
        .optional()
        .isISO8601()
        .withMessage('تاريخ الجدولة يجب أن يكون بتنسيق ISO 8601'),

    body('estimated_hours')
        .optional()
        .isDecimal()
        .withMessage('عدد الساعات المتوقعة يجب أن يكون رقماً'),
];

/**
 * Validation rules for task ID
 */
export const taskIdValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('معرف المهمة غير صحيح'),
];

/**
 * Validation rules for complete maintenance task
 */
export const completeTaskValidation = [
    param('id')
        .isInt({ min: 1 }),

    body('actual_hours')
        .isDecimal()
        .withMessage('عدد الساعات الفعلية مطلوب ويجب أن يكون رقماً'),

    body('cost')
        .isDecimal()
        .withMessage('التكلفة مطلوبة ويجب أن تكون رقماً'),

    body('parts_used')
        .optional()
        .trim(),

    body('notes')
        .optional()
        .trim(),
];

/**
 * Validation rules for update status
 */
export const updateTaskStatusValidation = [
    param('id').isInt({ min: 1 }),
    body('status')
        .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
        .withMessage('الحالة غير صحيحة'),
];
