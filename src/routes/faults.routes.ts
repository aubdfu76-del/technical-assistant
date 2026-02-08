import express from 'express';
import {
    getFaults,
    getFaultById,
    createFault,
    updateFaultStatus,
    resolveFault
} from '../controllers/faults.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
    createFaultValidation,
    faultIdValidation,
    updateFaultStatusValidation,
    resolveFaultValidation
} from '../validators/faults.validator';

const router = express.Router();

// Require authentication for all fault routes
router.use(authenticate);

/**
 * @route GET /api/faults
 * @desc Get all faults
 */
router.get('/', getFaults);

/**
 * @route GET /api/faults/:id
 * @desc Get specific fault details
 */
router.get('/:id', validate(faultIdValidation), getFaultById);

/**
 * @route POST /api/faults
 * @desc Report a new fault (Technicians, Admins, Supervisors)
 */
router.post('/', validate(createFaultValidation), createFault);

/**
 * @route PATCH /api/faults/:id/status
 * @desc Update fault status (Admins and Supervisors only)
 */
router.patch('/:id/status',
    authorize('admin', 'supervisor'),
    validate(updateFaultStatusValidation),
    updateFaultStatus
);

/**
 * @route POST /api/faults/:id/resolve
 * @desc Mark fault as resolved
 */
router.post('/:id/resolve',
    authorize('admin', 'supervisor'),
    validate(resolveFaultValidation),
    resolveFault
);

export default router;
