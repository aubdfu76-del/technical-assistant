import express from 'express';
import {
    getRepairTasks,
    getRepairTaskDetails,
    createRepairTask,
    updateRepairTask,
    addRepairMedia,
    deleteRepairMedia,
    reorderRepairMedia,
    reorderRepairMediaBatch,
    getMaintenanceSections,
    createMaintenanceSection,
    deleteRepairTask,
    deleteMaintenanceSection
} from '../controllers/repair.controller';

import { authenticate, authorize } from '../middleware/auth.middleware';

console.log('🛣️ Repair Routes Loading...');

const router = express.Router();

router.use((req, res, next) => {
    console.log(`[Repair Route] ${req.method} ${req.url}`);
    next();
});

router.use(authenticate);

router.get('/tasks', getRepairTasks);
router.post('/tasks', createRepairTask);
router.get('/tasks/:id', getRepairTaskDetails);
router.delete('/tasks/:id', authorize('admin', 'supervisor', 'trainer'), deleteRepairTask); // New Delete Route

// Sections Routes
router.get('/sections', getMaintenanceSections);
router.post('/sections', authorize('admin', 'supervisor', 'trainer'), createMaintenanceSection);
router.delete('/sections/:id', authorize('admin', 'supervisor', 'trainer'), deleteMaintenanceSection); // New Delete Route

router.put('/tasks/:id', updateRepairTask);
// ... existing code ...
router.post('/tasks/:id/media', addRepairMedia);
router.delete('/media/:mediaId', deleteRepairMedia); // New
router.put('/media/:mediaId/order', reorderRepairMedia); // New
router.post('/media/reorder-batch', reorderRepairMediaBatch); // New Batch

export default router;
