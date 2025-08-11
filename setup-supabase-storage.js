const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorageBuckets() {
  try {
    console.log('🚀 Setting up Supabase Storage buckets...');
    
    // Create berita-images bucket
    try {
      const { data: beritaBucket, error: beritaError } = await supabase.storage
        .createBucket('berita-images', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          fileSizeLimit: 5242880, // 5MB
        });
      
      if (beritaError) {
        if (beritaError.message.includes('already exists')) {
          console.log('✅ berita-images bucket already exists');
        } else {
          console.error('❌ Error creating berita-images bucket:', beritaError);
        }
      } else {
        console.log('✅ Created berita-images bucket');
      }
    } catch (error) {
      console.log('ℹ️ berita-images bucket setup:', error.message);
    }
    
    // Create dokumentasi-files bucket
    try {
      const { data: docBucket, error: docError } = await supabase.storage
        .createBucket('dokumentasi-files', {
          public: true,
          allowedMimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp'
          ],
          fileSizeLimit: 52428800, // 50MB
        });
      
      if (docError) {
        if (docError.message.includes('already exists')) {
          console.log('✅ dokumentasi-files bucket already exists');
        } else {
          console.error('❌ Error creating dokumentasi-files bucket:', docError);
        }
      } else {
        console.log('✅ Created dokumentasi-files bucket');
      }
    } catch (error) {
      console.log('ℹ️ dokumentasi-files bucket setup:', error.message);
    }
    
    // Create dokumentasi-thumbnails bucket
    try {
      const { data: thumbBucket, error: thumbError } = await supabase.storage
        .createBucket('dokumentasi-thumbnails', {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg'],
          fileSizeLimit: 1048576, // 1MB
        });
      
      if (thumbError) {
        if (thumbError.message.includes('already exists')) {
          console.log('✅ dokumentasi-thumbnails bucket already exists');
        } else {
          console.error('❌ Error creating dokumentasi-thumbnails bucket:', thumbError);
        }
      } else {
        console.log('✅ Created dokumentasi-thumbnails bucket');
      }
    } catch (error) {
      console.log('ℹ️ dokumentasi-thumbnails bucket setup:', error.message);
    }
    
    console.log('🎉 Supabase Storage setup completed!');
    
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (!listError && buckets) {
      console.log('\n📦 Available buckets:');
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupStorageBuckets();
