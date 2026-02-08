import express from 'express';
import { getUnits, createUnit, deleteUnit } from '../controllers/units.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// List available (Public for registration)
router.get('/', getUnits);

router.use(authenticate);

// Management restricted to Admin
router.post('/', authorize('admin'), createUnit);
router.delete('/:id', authorize('admin'), deleteUnit);

export default router;
