import express from 'express';
import {
    getDiagnosisSystems,
    getSystemItems,
    getDiagnosisItemDetails,
    createDiagnosisSystem,
    createDiagnosisItem,
    updateDiagnosisItem,
    addDiagnosisMedia,
    updateDiagnosisMedia,
    deleteDiagnosisMedia,
    deleteDiagnosisSystem,
    deleteDiagnosisItem
} from '../controllers/systems.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate);

// Public (Technician) Diagnosis Routes
router.get('/', getDiagnosisSystems);
router.get('/:id/items', getSystemItems);

// Management (Admin/Supervisor/Trainer) - Create System
router.post('/', authorize('admin', 'supervisor', 'trainer'), createDiagnosisSystem);
router.delete('/:id', authorize('admin', 'supervisor', 'trainer'), deleteDiagnosisSystem); // New Delete System

// Media Management (Admin/Supervisor/Trainer) - MUST BE BEFORE /items/:id
router.put('/media/:mediaId', authorize('admin', 'supervisor', 'trainer'), updateDiagnosisMedia);
router.delete('/media/:mediaId', authorize('admin', 'supervisor', 'trainer'), deleteDiagnosisMedia);

// Item Details - MUST BE AFTER /media routes
router.get('/items/:id', getDiagnosisItemDetails);

// Management (Admin/Supervisor/Trainer) Diagnosis Routes
router.post('/items', authorize('admin', 'supervisor', 'trainer'), createDiagnosisItem);
router.put('/items/:id', authorize('admin', 'supervisor', 'trainer'), updateDiagnosisItem);
router.post('/items/:id/media', authorize('admin', 'supervisor', 'trainer'), addDiagnosisMedia);
router.delete('/items/:id', authorize('admin', 'supervisor', 'trainer'), deleteDiagnosisItem); // New Delete Item

export default router;
