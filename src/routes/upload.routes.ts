import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Create unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File Filter (Images and Videos)
const fileFilter = (req: any, file: any, cb: any) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|webm|quicktime/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('فقط الصور (jpg, png, gif) والفيديوهات (mp4, webm) مسموح بها'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 200 * 1024 * 1024 // 200MB max size for videos
    },
    fileFilter: fileFilter
});

/**
 * @route POST /api/upload
 * @desc Upload a single file (image or video)
 */
router.post('/', authenticate, (req: any, res: any) => {
    upload.single('file')(req, res, (err: any) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'حجم الملف كبير جداً. الحد الأقصى المسموح به هو 200 ميجابايت'
                });
            }
            return res.status(400).json({
                success: false,
                message: err.message || 'فشل في رفع الملف'
            });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'لم يتم اختيار ملف' });
            }

            // Return the relative URL to the file
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

            res.json({
                success: true,
                message: 'تم رفع الملف بنجاح',
                data: {
                    filename: req.file.filename,
                    url: fileUrl,
                    type: req.file.mimetype.startsWith('image') ? 'image' : 'video'
                }
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
});

export default router;
