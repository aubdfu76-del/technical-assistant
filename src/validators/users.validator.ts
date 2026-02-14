import { body, param } from 'express-validator';

/**
 * Validation rules for creating a new user
 */
export const createUserValidation = [
    body('employee_id')
        .trim()
        .notEmpty()
        .withMessage('رقم الموظف مطلوب')
        .isLength({ min: 2, max: 50 })
        .withMessage('رقم الموظف يجب أن يكون بين 2 و 50 حرف')
        .matches(/^[\u0600-\u06FFa-zA-Z0-9_\-\s]+$/)
        .withMessage('رقم الموظف يجب أن يحتوي على أحرف عربية أو إنجليزية، أرقام، شرطات، أو مسافات فقط'),

    body('full_name')
        .trim()
        .notEmpty()
        .withMessage('الاسم الكامل مطلوب')
        .isLength({ min: 3, max: 255 })
        .withMessage('الاسم الكامل يجب أن يكون بين 3 و 255 حرف'),

    body('password')
        .notEmpty()
        .withMessage('كلمة المرور مطلوبة')
        .isLength({ min: 8 })
        .withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل'),

    body('role')
        .optional()
        .isIn(['admin', 'supervisor', 'technician', 'trainer'])
        .withMessage('الدور يجب أن يكون: admin, supervisor, technician, أو trainer'),
];

/**
 * Validation rules for updating a user
 */
export const updateUserValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('معرف المستخدم غير صحيح'),

    body('employee_id')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('رقم الموظف يجب أن يكون بين 2 و 50 حرف')
        .matches(/^[\u0600-\u06FFa-zA-Z0-9_\-\s]+$/)
        .withMessage('رقم الموظف يجب أن يحتوي على أحرف عربية أو إنجليزية، أرقام، شرطات، أو مسافات فقط'),

    body('full_name')
        .optional()
        .trim()
        .isLength({ min: 3, max: 255 })
        .withMessage('الاسم الكامل يجب أن يكون بين 3 و 255 حرف'),

    body('role')
        .optional()
        .isIn(['admin', 'supervisor', 'technician', 'trainer'])
        .withMessage('الدور يجب أن يكون: admin, supervisor, technician, أو trainer'),
];

/**
 * Validation rules for user ID parameter
 */
export const userIdValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('معرف المستخدم غير صحيح'),
];

/**
 * Validation rules for updating user status
 */
export const updateUserStatusValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('معرف المستخدم غير صحيح'),

    body('is_active')
        .isBoolean()
        .withMessage('حالة المستخدم يجب أن تكون true أو false'),
];

/**
 * Validation rules for changing password
 */
export const changePasswordValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('معرف المستخدم غير صحيح'),

    body('current_password')
        .notEmpty()
        .withMessage('كلمة المرور الحالية مطلوبة'),

    body('new_password')
        .notEmpty()
        .withMessage('كلمة المرور الجديدة مطلوبة')
        .isLength({ min: 8 })
        .withMessage('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل'),
];
