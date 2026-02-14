import express from 'express';
import { getStats, getRecentActivity } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// All authenticated users can access dashboard data
router.use(authenticate);

/**
 * @route GET /api/dashboard/stats
 */
router.get('/stats', getStats);

/**
 * @route GET /api/dashboard/recent-activity
 */
router.get('/recent-activity', getRecentActivity);

export default router;
