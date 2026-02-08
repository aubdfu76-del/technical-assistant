import express from 'express';
import {
    getCommonFaults,
    getCommonFaultDetails,
    createCommonFault,
    deleteCommonFault
} from '../controllers/diagnosis.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate);

/**
 * @route GET /api/diagnosis/common
 * @desc Get list of all common faults
 */
router.get('/common', getCommonFaults);

/**
 * @route GET /api/diagnosis/common/:id
 * @desc Get details of a specific common fault
 */
router.get('/common/:id', getCommonFaultDetails);

/**
 * @route POST /api/diagnosis/common
 * @desc Add new common fault (Admins and Supervisors only)
 */
router.post('/common', authorize('admin', 'supervisor'), createCommonFault);
router.delete('/common/:id', authorize('admin', 'supervisor'), deleteCommonFault); // New Delete Route

export default router;
