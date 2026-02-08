import express from 'express';
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    changePassword,
    getUserVehicles,
    updateUserVehicles,
} from '../controllers/users.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
    createUserValidation,
    updateUserValidation,
    userIdValidation,
    updateUserStatusValidation,
    changePasswordValidation,
} from '../validators/users.validator';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (admin, supervisor)
 */
router.get('/',
    authorize('admin', 'supervisor'),
    getUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (admin, supervisor)
 */
router.get('/:id',
    authorize('admin', 'supervisor'),
    validate(userIdValidation),
    getUserById
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (admin only)
 */
router.post('/',
    authorize('admin'),
    validate(createUserValidation),
    createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (admin only)
 */
router.put('/:id',
    authorize('admin'),
    validate(updateUserValidation),
    updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (admin only)
 */
router.delete('/:id',
    authorize('admin', 'supervisor'),
    validate(userIdValidation),
    deleteUser
);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Update user status (activate/deactivate)
 * @access  Private (admin only)
 */
router.patch('/:id/status',
    authorize('admin', 'supervisor'),
    validate(updateUserStatusValidation),
    updateUserStatus
);

/**
 * @route   PATCH /api/users/:id/password
 * @desc    Change user password
 * @access  Private (admin or self)
 */
router.patch('/:id/password',
    validate(changePasswordValidation),
    changePassword
);

/**
 * @route   GET /api/users/:id/vehicles
 * @desc    Get assigned vehicles
 * @access  Private (admin, supervisor, trainer)
 */
router.get('/:id/vehicles',
    authorize('admin', 'supervisor', 'trainer'),
    validate(userIdValidation),
    getUserVehicles
);

/**
 * @route   PUT /api/users/:id/vehicles
 * @desc    Update assigned vehicles
 * @access  Private (admin only)
 */
router.put('/:id/vehicles',
    authorize('admin'),
    validate(userIdValidation),
    updateUserVehicles
);

export default router;
