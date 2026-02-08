import express from 'express';
import {
    getMaintenanceTasks,
    createMaintenanceTask,
    updateTaskStatus,
    completeTask
} from '../controllers/maintenance.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
    createMaintenanceValidation,
    taskIdValidation,
    updateTaskStatusValidation,
    completeTaskValidation
} from '../validators/maintenance.validator';

const router = express.Router();

router.use(authenticate);

/**
 * @route GET /api/maintenance
 * @desc Get all tasks
 */
router.get('/', getMaintenanceTasks);

/**
 * @route POST /api/maintenance
 * @desc Create new maintenance task (Admins/Supervisors only)
 */
router.post('/',
    authorize('admin', 'supervisor'),
    validate(createMaintenanceValidation),
    createMaintenanceTask
);

/**
 * @route PATCH /api/maintenance/:id/status
 * @desc Update task status
 */
router.patch('/:id/status',
    validate(updateTaskStatusValidation),
    updateTaskStatus
);

/**
 * @route POST /api/maintenance/:id/complete
 * @desc Complete task and record costs (Admins/Supervisors only or specific Technicians)
 */
router.post('/:id/complete',
    authorize('admin', 'supervisor'),
    validate(completeTaskValidation),
    completeTask
);

export default router;
