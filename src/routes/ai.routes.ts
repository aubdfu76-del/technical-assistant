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

            // Parse PDF with timeout - increased to 200 pages for comprehensive content
            const parsePromise = pdfParse(dataBuffer, {
                max: 200 // Extract up to 200 pages for thorough coverage
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('PDF parsing timeout')), 60000) // 60 seconds for larger files
            );

            const pdfData = await Promise.race([parsePromise, timeoutPromise]) as any;
            pdfContent = pdfData.text || '';

            // Clean up extracted text - remove excessive whitespace/newlines
            pdfContent = pdfContent
                .replace(/\n{3,}/g, '\n\n')  // Reduce multiple newlines
                .replace(/[ \t]{2,}/g, ' ')   // Reduce multiple spaces
                .trim();

            console.log(`✅ Extracted ${pdfContent.length} characters from PDF (${pdfData.numpages || '?'} pages)`);

            // Limit content to 500,000 characters to prevent database issues
            if (pdfContent.length > 500000) {
                console.log(`⚠️ Content too large (${pdfContent.length} chars), truncating to 500,000 chars`);
                pdfContent = pdfContent.substring(0, 500000);
            }
        } catch (pdfError: any) {
            console.error('⚠️ PDF parsing error:', pdfError.message);
            console.log('📝 Continuing without text extraction - file will be saved without searchable content');
            // Continue without content if parsing fails - file is still uploaded
        }

        const pool = getPool();

        // Save the vehicle ID directly in vehicle_type column for easy filtering on frontend
        const vehicleId = vehicle_type || null;

        // ✅ NOW saving content to the database!
        const result = await pool.query(
            `INSERT INTO technical_manuals (title, description, file_path, vehicle_type, uploaded_by, file_size, content)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [title, description || null, file.filename, vehicleId, userId, `${fileSizeMB} MB`, pdfContent || null]
        );

        console.log(`📚 Manual saved: "${title}" with ${pdfContent.length} chars of content`);

        res.json({
            success: true,
            message: `تم رفع الكراسة بنجاح${pdfContent ? ` (تم استخراج ${pdfContent.length} حرف من المحتوى)` : ' (بدون محتوى نصي)'}`,
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

// ============================================
// 🔍 Debug endpoint - Check AI system status
// ============================================
router.get('/debug', authenticate, async (req, res) => {
    try {
        const pool = getPool();

        // Check manuals and their content status
        const manualsResult = await pool.query(`
            SELECT id, title, file_path, 
                   CASE WHEN content IS NOT NULL AND LENGTH(content) > 0 THEN LENGTH(content) ELSE 0 END as content_length,
                   CASE WHEN content IS NOT NULL AND LENGTH(content) > 0 THEN true ELSE false END as has_content,
                   created_at
            FROM technical_manuals 
            ORDER BY created_at DESC
        `);

        // Check Gemini status
        const { geminiService } = await import('../services/gemini.service');
        const geminiInitialized = !!(geminiService as any).model;

        res.json({
            success: true,
            gemini: {
                initialized: geminiInitialized,
                api_key_set: !!process.env.GEMINI_API_KEY,
                model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
            },
            manuals: manualsResult.rows.map(m => ({
                id: m.id,
                title: m.title,
                has_content: m.has_content,
                content_length: m.content_length,
                file_exists: fs.existsSync(path.join(__dirname, '../../uploads/manuals', m.file_path)),
                created_at: m.created_at
            })),
            total_manuals: manualsResult.rows.length,
            manuals_with_content: manualsResult.rows.filter((m: any) => m.has_content).length
        });
    } catch (error: any) {
        console.error('Debug error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// 🔄 Reprocess manual - Re-extract PDF content
// ============================================
router.post('/manuals/:id/reprocess', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        // Get manual info
        const manual = await pool.query(
            'SELECT id, title, file_path FROM technical_manuals WHERE id = $1',
            [id]
        );

        if (manual.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الكراسة غير موجودة'
            });
        }

        const manualData = manual.rows[0];
        const filePath = path.join(__dirname, '../../uploads/manuals', manualData.file_path);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'ملف PDF غير موجود على السيرفر. يرجى إعادة رفع الكراسة.'
            });
        }

        console.log(`🔄 Reprocessing manual: "${manualData.title}" (${manualData.file_path})`);

        // Extract text from PDF
        let pdfContent = '';
        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync(filePath);

        const parsePromise = pdfParse(dataBuffer, {
            max: 200 // Up to 200 pages
        });

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('PDF parsing timeout - الملف كبير جداً')), 120000) // 2 minutes
        );

        const pdfData = await Promise.race([parsePromise, timeoutPromise]) as any;
        pdfContent = pdfData.text || '';

        // Clean up text
        pdfContent = pdfContent
            .replace(/\n{3,}/g, '\n\n')
            .replace(/[ \t]{2,}/g, ' ')
            .trim();

        // Limit to 500K chars
        if (pdfContent.length > 500000) {
            pdfContent = pdfContent.substring(0, 500000);
        }

        console.log(`✅ Extracted ${pdfContent.length} characters from "${manualData.title}" (${pdfData.numpages || '?'} pages)`);

        if (pdfContent.length === 0) {
            return res.json({
                success: false,
                message: 'لم يتم العثور على نص قابل للاستخراج في الملف. قد يكون الملف يحتوي على صور فقط.'
            });
        }

        // Update database with extracted content
        await pool.query(
            'UPDATE technical_manuals SET content = $1 WHERE id = $2',
            [pdfContent, id]
        );

        console.log(`💾 Saved ${pdfContent.length} chars to database for "${manualData.title}"`);

        res.json({
            success: true,
            message: `تم إعادة معالجة الكراسة بنجاح! تم استخراج ${pdfContent.length.toLocaleString()} حرف من ${pdfData.numpages || '?'} صفحة.`,
            data: {
                content_length: pdfContent.length,
                pages: pdfData.numpages || 0,
                preview: pdfContent.substring(0, 200) + '...'
            }
        });
    } catch (error: any) {
        console.error('Reprocess error:', error);
        res.status(500).json({
            success: false,
            message: `فشل إعادة معالجة الكراسة: ${error.message}`
        });
    }
});

export default router;
