import express from 'express';
import { getStats, getRecentActivity } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// Only admins and supervisors can access dashboard data
router.use(authenticate);
router.use(authorize('admin', 'supervisor'));

/**
 * @route GET /api/dashboard/stats
 */
router.get('/stats', getStats);

/**
 * @route GET /api/dashboard/recent-activity
 */
router.get('/recent-activity', getRecentActivity);

export default router;
