import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/auth.middleware';
import { supabase, STORAGE_BUCKET } from '../config/supabase';

const router = express.Router();

// Use memory storage instead of disk - files go directly to Supabase
const storage = multer.memoryStorage();

// File Filter (Images and Videos)
const fileFilter = (req: any, file: any, cb: any) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|quicktime/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname || mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('فقط الصور (jpg, png, gif, webp) والفيديوهات (mp4, webm) مسموح بها'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max (Supabase free plan limit)
    },
    fileFilter: fileFilter
});

/**
 * @route POST /api/upload
 * @desc Upload a single file (image or video) to Supabase Storage
 */
router.post('/', authenticate, (req: any, res: any) => {
    upload.single('file')(req, res, async (err: any) => {
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

            // Generate unique filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(req.file.originalname).toLowerCase();
            const filename = `${req.file.fieldname}-${uniqueSuffix}${ext}`;
            const filePath = `uploads/${filename}`;

            console.log(`📤 Uploading file to Supabase Storage: ${filename} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(filePath, req.file.buffer, {
                    contentType: req.file.mimetype,
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('❌ Supabase Storage upload error:', error.message);
                return res.status(500).json({
                    success: false,
                    message: 'فشل في رفع الملف إلى التخزين السحابي: ' + error.message
                });
            }

            // Get the public URL
            const { data: urlData } = supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(filePath);

            const fileUrl = urlData.publicUrl;

            console.log(`✅ File uploaded successfully: ${fileUrl}`);

            res.json({
                success: true,
                message: 'تم رفع الملف بنجاح',
                data: {
                    filename: filename,
                    url: fileUrl,
                    type: req.file.mimetype.startsWith('image') ? 'image' : 'video'
                }
            });
        } catch (error: any) {
            console.error('❌ Upload error:', error);
            res.status(500).json({ success: false, message: error.message || 'فشل في رفع الملف' });
        }
    });
});

export default router;
