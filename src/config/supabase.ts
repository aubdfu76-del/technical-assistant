import { createClient } from '@supabase/supabase-js';

// Supabase Configuration for Storage
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Supabase URL or Service Role Key not configured. File uploads will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Storage bucket name
export const STORAGE_BUCKET = 'media';

/**
 * Initialize Supabase Storage bucket
 * Creates the 'media' bucket if it doesn't exist
 */
export const initializeStorage = async () => {
    try {
        // Check if bucket exists
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            console.error('❌ Error listing Supabase buckets:', listError.message);
            return;
        }

        const bucketExists = buckets?.some(b => b.name === STORAGE_BUCKET);

        if (!bucketExists) {
            // Create the bucket with public access
            const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
                public: true,
                fileSizeLimit: 50 * 1024 * 1024, // 50MB (Supabase free plan limit)
                allowedMimeTypes: [
                    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
                    'video/mp4', 'video/webm', 'video/quicktime'
                ]
            });

            if (createError) {
                console.error('❌ Error creating storage bucket:', createError.message);
            } else {
                console.log('✅ Storage bucket "media" created successfully');
            }
        } else {
            console.log('✅ Storage bucket "media" already exists');
        }
    } catch (error: any) {
        console.error('❌ Error initializing Supabase Storage:', error.message);
    }
};

export default supabase;
