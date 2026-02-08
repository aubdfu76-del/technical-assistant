import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../config/database';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/manuals');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// Chat endpoint - Using Gemini AI
router.post('/chat', authenticate, async (req, res) => {
    try {
        const { message, session_id, vehicle_id } = req.body;
        const userId = (req as any).user.id;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'رسالة غير صالحة'
            });
        }

        // Use Gemini Service for intelligent responses
        const { geminiService } = await import('../services/gemini.service');
        const response = await geminiService.processQuery(userId, message, session_id || uuidv4(), vehicle_id);

        res.json({
            success: true,
            answer: response.answer,
            citations: response.citations,
            confidence: response.confidence,
            session_id: session_id || uuidv4()
        });
    } catch (error: any) {
        console.error('Chat error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء معالجة الرسالة'
        });
    }
});



// Upload manual
router.post('/manuals/upload', authenticate, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'حجم الملف كبير جداً. الحد الأقصى 100MB'
                });
            }
            return res.status(400).json({
                success: false,
                message: `خطأ في رفع الملف: ${err.message}`
            });
        } else if (err) {
            return res.status(500).json({
                success: false,
                message: err.message || 'خطأ في رفع الملف'
            });
        }
        next();
    });
}, async (req, res) => {
    try {
        const { title, description, vehicle_type } = req.body;
        const userId = (req as any).user.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'لم يتم رفع ملف'
            });
        }

        if (!title) {
            fs.unlinkSync(file.path);
            return res.status(400).json({
                success: false,
                message: 'العنوان مطلوب'
            });
        }

        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);

        // Extract text from PDF with timeout protection
        let pdfContent = '';
        try {
            console.log(`📄 Starting PDF extraction for file: ${file.filename} (${fileSizeMB}MB)`);
            const pdfParse = require('pdf-parse');
            const dataBuffer = fs.readFileSync(file.path);

            // Parse PDF with timeout
            const parsePromise = pdfParse(dataBuffer, {
                max: 50 // Limit to first 50 pages for large files
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('PDF parsing timeout')), 30000) // 30 seconds
            );

            const pdfData = await Promise.race([parsePromise, timeoutPromise]) as any;
            pdfContent = pdfData.text || '';
            console.log(`✅ Extracted ${pdfContent.length} characters from PDF`);

            // Limit content to 100,000 characters to prevent database issues
            if (pdfContent.length > 100000) {
                console.log(`⚠️ Content too large (${pdfContent.length} chars), truncating to 100,000 chars`);
                pdfContent = pdfContent.substring(0, 100000);
            }
        } catch (pdfError: any) {
            console.error('⚠️ PDF parsing error:', pdfError.message);
            console.log('📝 Continuing without text extraction - file will be saved without searchable content');
            // Continue without content if parsing fails - file is still uploaded
        }

        const pool = getPool();

        // Save the vehicle ID directly in vehicle_type column for easy filtering on frontend
        const vehicleId = vehicle_type || null;

        const result = await pool.query(
            `INSERT INTO technical_manuals (title, description, file_path, vehicle_type, uploaded_by, file_size)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [title, description || null, file.filename, vehicleId, userId, `${fileSizeMB} MB`]
        );

        res.json({
            success: true,
            message: 'تم رفع الكراسة بنجاح',
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('❌ Upload error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });

        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
                console.log('🗑️ Deleted uploaded file after error');
            } catch (e) {
                console.error('Failed to delete file:', e);
            }
        }

        res.status(500).json({
            success: false,
            message: error.message || 'فشل رفع الملف',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get all manuals
router.get('/manuals', authenticate, async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.query(
            `SELECT id, title, description, file_path, vehicle_type, file_size, created_at
             FROM technical_manuals
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error: any) {
        console.error('Get manuals error:', error);
        res.status(500).json({
            success: false,
            message: 'فشل تحميل الكراسات'
        });
    }
});

// Delete manual
router.delete('/manuals/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        // Get file path before deleting
        const manual = await pool.query(
            'SELECT file_path FROM technical_manuals WHERE id = $1',
            [id]
        );

        if (manual.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الكراسة غير موجودة'
            });
        }

        // Delete from database
        await pool.query('DELETE FROM technical_manuals WHERE id = $1', [id]);

        // Delete file
        const filePath = path.join(__dirname, '../../uploads/manuals', manual.rows[0].file_path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({
            success: true,
            message: 'تم حذف الكراسة بنجاح'
        });
    } catch (error: any) {
        console.error('Delete manual error:', error);
        res.status(500).json({
            success: false,
            message: 'فشل حذف الكراسة'
        });
    }
});

export default router;
