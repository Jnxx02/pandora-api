const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf2pic = require('pdf2pic');
const sharp = require('sharp');
// Load environment variables from .env file for local development
require('dotenv').config();

// Import email configuration
const { sendPengaduanNotification, sendPengaduanNotificationToMultiple } = require('./emailConfig');

const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3001;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create thumbnails directory if it doesn't exist
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir, { recursive: true });
}

// Function to generate thumbnail from PDF
async function generateThumbnailFromPDF(filePath, outputFileName) {
  try {
    console.log('Starting PDF thumbnail generation for:', filePath);
    
    // First, try to create a generic PDF icon as fallback
    const fallbackThumbnail = await generateGenericPDFThumbnail(outputFileName);
    
    // Try to use pdf2pic if available
    try {
      const convert = pdf2pic.fromPath(filePath, {
        density: 100,
        saveFilename: outputFileName,
        savePath: thumbnailsDir,
        format: "png",
        width: 300,
        height: 400
      });

      console.log('Attempting PDF conversion...');
      const result = await convert(1, { responseType: "image" });
      
      if (result && result.length > 0) {
        const thumbnailPath = result[0].path;
        console.log('PDF conversion successful, optimizing...');
        
        // Optimize the thumbnail with sharp
        const optimizedPath = path.join(thumbnailsDir, `${outputFileName}-optimized.png`);
        await sharp(thumbnailPath)
          .resize(300, 400, { 
            fit: 'cover',
            position: 'top'
          })
          .png({ quality: 80 })
          .toFile(optimizedPath);
        
        // Remove original unoptimized file
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
        
        console.log('PDF thumbnail generated successfully:', `${outputFileName}-optimized.png`);
        return `${outputFileName}-optimized.png`;
      }
    } catch (pdf2picError) {
      console.warn('pdf2pic failed, using fallback thumbnail:', pdf2picError.message);
      return fallbackThumbnail;
    }
    
    // If pdf2pic didn't work, return the fallback
    return fallbackThumbnail;
    
  } catch (error) {
    console.error('Error generating PDF thumbnail:', error);
    // Try to generate a generic fallback
    try {
      return await generateGenericPDFThumbnail(outputFileName);
    } catch (fallbackError) {
      console.error('Failed to generate fallback thumbnail:', fallbackError);
      return null;
    }
  }
}

// Generate a generic PDF icon thumbnail
async function generateGenericPDFThumbnail(outputFileName) {
  try {
    const svgIcon = `
      <svg width="300" height="400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pdfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FF5722;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#D32F2F;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="300" height="400" fill="url(#pdfGrad)" rx="15" ry="15"/>
        <rect x="20" y="60" width="260" height="280" fill="white" rx="8" ry="8" opacity="0.9"/>
        
        <!-- PDF Icon -->
        <path d="M150 100 L180 130 L180 180 L120 180 L120 130 Z" fill="#FF5722" opacity="0.8"/>
        <text x="150" y="155" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">PDF</text>
        
        <!-- Document lines -->
        <line x1="140" y1="200" x2="240" y2="200" stroke="#FF5722" stroke-width="3" opacity="0.6"/>
        <line x1="140" y1="220" x2="220" y2="220" stroke="#FF5722" stroke-width="2" opacity="0.4"/>
        <line x1="140" y1="240" x2="260" y2="240" stroke="#FF5722" stroke-width="2" opacity="0.4"/>
        <line x1="140" y1="260" x2="200" y2="260" stroke="#FF5722" stroke-width="2" opacity="0.4"/>
        
        <!-- Footer -->
        <text x="150" y="370" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white">PDF Document</text>
      </svg>
    `;
    
    const thumbnailPath = path.join(thumbnailsDir, `${outputFileName}.png`);
    await sharp(Buffer.from(svgIcon))
      .png()
      .toFile(thumbnailPath);
    
    console.log('Generic PDF thumbnail generated:', `${outputFileName}.png`);
    return `${outputFileName}.png`;
  } catch (error) {
    console.error('Error generating generic PDF thumbnail:', error);
    throw error;
  }
}

// Function to generate thumbnail for Office documents (placeholder)
async function generateThumbnailFromOffice(filePath, outputFileName) {
  try {
    // For now, create a generic thumbnail for Office documents
    // In a production environment, you might want to use libraries like:
    // - libreoffice-convert for converting to PDF first
    // - or create custom thumbnails based on file type
    
    const fileExt = path.extname(filePath).toLowerCase();
    let iconColor = '#4285F4'; // Default blue
    let iconText = 'DOC';
    
    switch (fileExt) {
      case '.docx':
      case '.doc':
        iconColor = '#2B579A';
        iconText = 'DOC';
        break;
      case '.xlsx':
      case '.xls':
        iconColor = '#217346';
        iconText = 'XLS';
        break;
      case '.pptx':
      case '.ppt':
        iconColor = '#D24726';
        iconText = 'PPT';
        break;
    }
    
    // Create a simple thumbnail using Sharp
    const svgIcon = `
      <svg width="300" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="400" fill="${iconColor}"/>
        <rect x="20" y="20" width="260" height="320" fill="white" rx="10"/>
        <text x="150" y="200" font-family="Arial, sans-serif" font-size="36" font-weight="bold" 
              text-anchor="middle" fill="${iconColor}">${iconText}</text>
        <text x="150" y="240" font-family="Arial, sans-serif" font-size="14" 
              text-anchor="middle" fill="#666">Document</text>
      </svg>
    `;
    
    const thumbnailPath = path.join(thumbnailsDir, `${outputFileName}.png`);
    await sharp(Buffer.from(svgIcon))
      .png()
      .toFile(thumbnailPath);
    
    return `${outputFileName}.png`;
  } catch (error) {
    console.error('Error generating Office document thumbnail:', error);
    return null;
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'berita-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Increase payload size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://pandora-vite.vercel.app', 'https://www.moncongloebulu.com', 'https://moncongloebulu.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Inisialisasi Supabase Client dengan error handling yang lebih baik
let supabase = null;
let supabaseStatus = 'not_configured';

try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Check if Supabase is properly configured
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    supabaseStatus = 'configured';
    console.log('✅ Supabase client initialized successfully with service role key');
    console.log('🔗 Supabase URL:', supabaseUrl);
    console.log('🔑 Service Role Key:', supabaseKey ? '***configured***' : 'missing');
  } else {
    console.log('⚠️  Supabase not configured, using local fallback mode');
    console.log('📋 Environment variables:');
    console.log('   SUPABASE_URL:', supabaseUrl ? 'configured' : 'missing');
    console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'configured' : 'missing');
    supabaseStatus = 'not_configured';
  }
} catch (error) {
  console.log('⚠️  Failed to initialize Supabase client:', error.message);
  supabaseStatus = 'error';
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    supabase: supabaseStatus,
    message: 'Backend server is running'
  });
});

// Debug endpoint for troubleshooting
app.get('/api/debug', async (req, res) => {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      supabaseStatus: supabaseStatus,
      supabaseUrl: process.env.SUPABASE_URL ? 'configured' : 'missing',
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing',
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };

    // Test Supabase connection if configured
    if (supabase && supabaseStatus === 'configured') {
      try {
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        debugInfo.storageBuckets = bucketError ? { error: bucketError.message } : buckets.map(b => b.name);
        debugInfo.supabaseConnection = 'success';
      } catch (error) {
        debugInfo.supabaseConnection = { error: error.message };
      }
    }

    res.json(debugInfo);
  } catch (error) {
    res.status(500).json({ error: 'Debug failed', details: error.message });
  }
});

// Setup storage endpoint (for Vercel deployment)
app.post('/api/setup-storage', async (req, res) => {
  try {
    if (!supabase || supabaseStatus !== 'configured') {
      return res.status(400).json({ 
        error: 'Supabase not configured',
        supabaseStatus: supabaseStatus
      });
    }

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
          throw beritaError;
        }
      } else {
        console.log('✅ Created berita-images bucket');
      }
    } catch (error) {
      console.log('ℹ️ berita-images bucket setup:', error.message);
    }
    
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      throw listError;
    }
    
    res.json({
      message: 'Storage setup completed',
      buckets: buckets.map(b => ({ name: b.name, public: b.public })),
      beritaImagesBucket: buckets.find(b => b.name === 'berita-images')
    });
    
  } catch (error) {
    console.error('❌ Storage setup failed:', error);
    res.status(500).json({ 
      error: 'Storage setup failed',
      details: error.message
    });
  }
});

// Test upload endpoint (for debugging)
app.post('/api/test-upload', upload.single('test'), async (req, res) => {
  try {
    console.log('🧪 Test upload endpoint called');
    console.log('📋 Request details:', {
      hasFile: !!req.file,
      fileInfo: req.file ? {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      } : null,
      supabaseStatus: supabaseStatus,
      environment: process.env.NODE_ENV
    });

    if (!req.file) {
      return res.status(400).json({ error: 'No test file uploaded' });
    }

    // Test basic file operations
    const testResults = {
      fileRead: false,
      fileExists: false,
      supabaseTest: false,
      cleanup: false
    };

    // Test 1: Check if file exists
    try {
      testResults.fileExists = fs.existsSync(req.file.path);
      console.log('✅ File exists check:', testResults.fileExists);
    } catch (error) {
      console.error('❌ File exists check failed:', error.message);
    }

    // Test 2: Try to read file
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      testResults.fileRead = fileBuffer.length > 0;
      console.log('✅ File read test:', testResults.fileRead, 'Size:', fileBuffer.length);
    } catch (error) {
      console.error('❌ File read test failed:', error.message);
    }

    // Test 3: Test Supabase connection
    if (supabase && supabaseStatus === 'configured') {
      try {
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        testResults.supabaseTest = !bucketError;
        console.log('✅ Supabase test:', testResults.supabaseTest, 'Buckets:', buckets?.map(b => b.name));
      } catch (error) {
        console.error('❌ Supabase test failed:', error.message);
      }
    }

    // Test 4: Cleanup
    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        testResults.cleanup = true;
        console.log('✅ File cleanup successful');
      }
    } catch (error) {
      console.error('❌ File cleanup failed:', error.message);
    }

    res.json({
      message: 'Test upload completed',
      results: testResults,
      supabaseStatus: supabaseStatus,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test upload failed:', error);
    res.status(500).json({ 
      error: 'Test upload failed', 
      details: error.message,
      supabaseStatus: supabaseStatus
    });
  }
});

// Test email endpoint


// Upload image endpoint with Supabase Storage support
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    // Use Supabase Storage if configured, otherwise fallback to local storage
    if (supabase && supabaseStatus === 'configured') {
      try {
        console.log('🗄️ Uploading to Supabase Storage...');
        console.log('📋 Upload details:', {
          filename: req.file.filename,
          mimetype: req.file.mimetype,
          size: req.file.size,
          bucket: 'berita-images'
        });
        
        // Check if bucket exists first
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        if (bucketError) {
          console.error('❌ Error listing buckets:', bucketError);
          throw new Error(`Bucket listing failed: ${bucketError.message}`);
        }
        
        const beritaBucket = buckets.find(b => b.name === 'berita-images');
        if (!beritaBucket) {
          console.error('❌ berita-images bucket not found!');
          console.log('📦 Available buckets:', buckets.map(b => b.name));
          throw new Error('berita-images bucket does not exist. Please run setup:storage first.');
        }
        
        console.log('✅ Found berita-images bucket');
        
        // Read file buffer
        const fileBuffer = fs.readFileSync(req.file.path);
        const fileName = req.file.filename;
        const fileType = req.file.mimetype;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('berita-images')
          .upload(fileName, fileBuffer, {
            contentType: fileType,
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('❌ Supabase Storage upload error:', uploadError);
          throw new Error(`Supabase upload failed: ${uploadError.message}`);
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('berita-images')
          .getPublicUrl(fileName);
        
        // Clean up local file
        fs.unlinkSync(req.file.path);
        
        console.log('✅ Image uploaded to Supabase Storage successfully');
        console.log('🔗 Public URL:', urlData.publicUrl);
        
        res.status(200).json({
          message: 'Image uploaded successfully to cloud storage',
          imageUrl: urlData.publicUrl,
          filename: fileName,
          storage: 'supabase'
        });
        
      } catch (supabaseError) {
        console.error('❌ Supabase Storage error, falling back to local storage:', supabaseError);
        console.log('📋 Error details:', {
          message: supabaseError.message,
          stack: supabaseError.stack
        });
        
        // Fallback to local storage
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        
        res.status(200).json({
          message: 'Image uploaded to local storage (fallback)',
          imageUrl: imageUrl,
          filename: req.file.filename,
          storage: 'local'
        });
      }
    } else {
      // Local storage only
      console.log('📁 Using local storage...');
      const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      
      res.status(200).json({
        message: 'Image uploaded to local storage',
        imageUrl: imageUrl,
        filename: req.file.filename,
        storage: 'local'
      });
    }
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    console.log('📋 Error context:', {
      supabaseStatus: supabaseStatus,
      hasSupabase: !!supabase,
      environment: process.env.NODE_ENV,
      errorType: error.constructor.name,
      errorStack: error.stack
    });
    
    // Clean up file if exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('✅ Local file cleaned up');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup file:', cleanupError.message);
      }
    }
    
    // Provide more detailed error information
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Failed to upload image. Please try again.' 
      : `Upload failed: ${error.message}`;
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'production' ? undefined : error.message,
      supabaseStatus: supabaseStatus,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  }
});

// Configure multer for documentation files (different from image upload)
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for documents
  },
  fileFilter: (req, file, cb) => {
    // Accept various document types
    const allowedTypes = [
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
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Please upload PDF, Word, Excel, PowerPoint, or image files.'), false);
    }
  }
});

// Upload documentation file endpoint with Supabase Storage support
app.post('/api/upload-document', uploadDocument.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file uploaded' });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.filename).toLowerCase();
    const baseFileName = path.parse(req.file.filename).name;
    
    // Use Supabase Storage if configured, otherwise fallback to local storage
    if (supabase && supabaseStatus === 'configured') {
      try {
        console.log('🗄️ Uploading document to Supabase Storage...');
        
        // Read file buffer
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = req.file.filename;
        const fileType = req.file.mimetype;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('dokumentasi-files')
          .upload(fileName, fileBuffer, {
            contentType: fileType,
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('❌ Supabase Storage upload error:', uploadError);
          throw new Error(`Supabase upload failed: ${uploadError.message}`);
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('dokumentasi-files')
          .getPublicUrl(fileName);
        
        // Generate thumbnail based on file type
        let thumbnailUrl = null;
        let thumbnailFilename = null;
        
        try {
          if (fileExt === '.pdf') {
            // Generate thumbnail from PDF
            thumbnailFilename = await generateThumbnailFromPDF(filePath, `thumb-${baseFileName}`);
          } else if (['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(fileExt)) {
            // Generate generic thumbnail for Office documents
            thumbnailFilename = await generateThumbnailFromOffice(filePath, `thumb-${baseFileName}`);
          }
          
          if (thumbnailFilename) {
            // Upload thumbnail to Supabase Storage
            const thumbnailBuffer = fs.readFileSync(path.join(thumbnailsDir, thumbnailFilename));
            const { error: thumbUploadError } = await supabase.storage
              .from('dokumentasi-thumbnails')
              .upload(thumbnailFilename, thumbnailBuffer, {
                contentType: 'image/png',
                cacheControl: '3600',
                upsert: false
              });
            
            if (!thumbUploadError) {
              const { data: thumbUrlData } = supabase.storage
                .from('dokumentasi-thumbnails')
                .getPublicUrl(thumbnailFilename);
              thumbnailUrl = thumbUrlData.publicUrl;
            }
          }
        } catch (thumbnailError) {
          console.error('Error generating thumbnail:', thumbnailError);
          // Continue without thumbnail if generation fails
        }
        
        // Clean up local files
        fs.unlinkSync(filePath);
        if (thumbnailFilename && fs.existsSync(path.join(thumbnailsDir, thumbnailFilename))) {
          fs.unlinkSync(path.join(thumbnailsDir, thumbnailFilename));
        }
        
        console.log('✅ Document uploaded to Supabase Storage successfully');
        
        res.status(200).json({
          message: 'Document uploaded successfully to cloud storage',
          documentUrl: urlData.publicUrl,
          filename: fileName,
          originalName: req.file.originalname,
          mimetype: fileType,
          size: req.file.size,
          thumbnailUrl: thumbnailUrl,
          thumbnailFilename: thumbnailFilename,
          storage: 'supabase'
        });
        
      } catch (supabaseError) {
        console.error('❌ Supabase Storage error, falling back to local storage:', supabaseError);
        
        // Fallback to local storage
        const documentUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        
        res.status(200).json({
          message: 'Document uploaded to local storage (fallback)',
          documentUrl: documentUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          thumbnailUrl: thumbnailUrl,
          thumbnailFilename: thumbnailFilename,
          storage: 'local'
        });
      }
    } else {
      // Local storage only
      console.log('📁 Using local storage for document...');
      
      // Generate thumbnail based on file type
      let thumbnailUrl = null;
      let thumbnailFilename = null;
      
      try {
        if (fileExt === '.pdf') {
          // Generate thumbnail from PDF
          thumbnailFilename = await generateThumbnailFromPDF(filePath, `thumb-${baseFileName}`);
        } else if (['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(fileExt)) {
          // Generate generic thumbnail for Office documents
          thumbnailFilename = await generateThumbnailFromOffice(filePath, `thumb-${baseFileName}`);
        }
        
        if (thumbnailFilename) {
          thumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/thumbnails/${thumbnailFilename}`;
        }
      } catch (thumbnailError) {
        console.error('Error generating thumbnail:', thumbnailError);
        // Continue without thumbnail if generation fails
      }

      // Return the URL path to access the uploaded document
      const documentUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      
      res.status(200).json({
        message: 'Document uploaded to local storage',
        documentUrl: documentUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        thumbnailUrl: thumbnailUrl,
        thumbnailFilename: thumbnailFilename,
        storage: 'local'
      });
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    
    // Clean up file if exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Upload thumbnail endpoint
app.post('/api/upload-thumbnail', upload.single('thumbnail'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No thumbnail file uploaded' });
    }

    // Return the URL path to access the uploaded thumbnail
    const thumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    res.status(200).json({
      message: 'Thumbnail uploaded successfully',
      thumbnailUrl: thumbnailUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    res.status(500).json({ error: 'Failed to upload thumbnail' });
  }
});

// Regenerate thumbnail from existing document endpoint
app.post('/api/regenerate-thumbnail', async (req, res) => {
  try {
    const { documentUrl } = req.body;
    console.log('Regenerate thumbnail request for:', documentUrl);
    
    if (!documentUrl) {
      return res.status(400).json({ error: 'Document URL is required' });
    }

    // Extract filename from URL
    let filename;
    let filePath;
    
    if (documentUrl.startsWith('http://localhost:3001/uploads/') || documentUrl.includes('/uploads/')) {
      // URL from our server - extract filename from URL
      const urlParts = documentUrl.split('/');
      filename = urlParts[urlParts.length - 1];
      filePath = path.join(uploadsDir, filename);
    } else if (documentUrl.startsWith('http')) {
      // External URL - cannot regenerate thumbnail
      console.error('Cannot regenerate thumbnail for external URL:', documentUrl);
      return res.status(400).json({ error: 'Cannot regenerate thumbnail for external URLs' });
    } else {
      // Assume it's a relative path or filename
      filename = documentUrl.split('/').pop();
      filePath = path.join(uploadsDir, filename);
    }
    
    console.log('Looking for file at:', filePath);
    console.log('File exists:', fs.existsSync(filePath));
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).json({ error: `Document file not found: ${filename}` });
    }

    const fileExt = path.extname(filename).toLowerCase();
    const baseFileName = path.parse(filename).name;
    
    console.log('File extension:', fileExt);
    console.log('Base filename:', baseFileName);
    
    // Generate thumbnail based on file type
    let thumbnailUrl = null;
    let thumbnailFilename = null;
    
    try {
      if (fileExt === '.pdf') {
        console.log('Generating PDF thumbnail...');
        // Generate thumbnail from PDF
        thumbnailFilename = await generateThumbnailFromPDF(filePath, `thumb-${baseFileName}`);
      } else if (['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(fileExt)) {
        console.log('Generating Office document thumbnail...');
        // Generate generic thumbnail for Office documents
        thumbnailFilename = await generateThumbnailFromOffice(filePath, `thumb-${baseFileName}`);
      } else {
        console.error('Unsupported file type:', fileExt);
        return res.status(400).json({ error: `File type not supported for thumbnail generation: ${fileExt}` });
      }
      
      console.log('Generated thumbnail filename:', thumbnailFilename);
      
      if (thumbnailFilename) {
        thumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/thumbnails/${thumbnailFilename}`;
        console.log('Thumbnail URL:', thumbnailUrl);
      }
    } catch (thumbnailError) {
      console.error('Error generating thumbnail:', thumbnailError);
      console.error('Stack trace:', thumbnailError.stack);
      return res.status(500).json({ error: `Failed to generate thumbnail: ${thumbnailError.message}` });
    }

    if (!thumbnailUrl) {
      console.error('No thumbnail URL generated');
      return res.status(500).json({ error: 'Failed to generate thumbnail - no URL returned' });
    }
    
    console.log('Thumbnail regeneration successful');
    res.status(200).json({
      message: 'Thumbnail regenerated successfully',
      thumbnailUrl: thumbnailUrl,
      thumbnailFilename: thumbnailFilename
    });
  } catch (error) {
    console.error('Error regenerating thumbnail:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: `Failed to regenerate thumbnail: ${error.message}` });
  }
});

// API endpoint untuk MENGAMBIL (GET) statistik
app.get('/api/statistik', async (req, res) => {
  try {
    if (supabase && supabaseStatus === 'configured') {
      // Use Supabase if available
      const { data, error } = await supabase
        .from('statistik')
        .select('icon, label, value');

      if (error) {
        throw error;
      }

      // Urutkan data sesuai urutan yang diminta
      const sortStatistik = (data) => {
        const orderMap = {
          'Penduduk': 1,
          'Laki-Laki': 2,
          'Perempuan': 3,
          'Kepala Keluarga': 4,
          'Diccekang': 5,
          'Tamalate': 6,
          'Tammu-Tammu': 7,
          'Tompo Balang': 8,
          'Moncongloe Bulu': 9
        };

        return [...data].sort((a, b) => {
          const orderA = orderMap[a.label] || 999;
          const orderB = orderMap[b.label] || 999;
          return orderA - orderB;
        });
      };

      const sortedData = sortStatistik(data || []);
      res.status(200).json(sortedData);
    } else {
      // Fallback: return default data untuk development
      console.log('📊 Returning development statistik data');
      const defaultData = [
        { label: 'Penduduk', value: '3.820', icon: null },
        { label: 'Laki-Laki', value: '1.890', icon: null },
        { label: 'Perempuan', value: '1.930', icon: null },
        { label: 'Kepala Keluarga', value: '1.245', icon: null },
        { label: 'Diccekang', value: '850', icon: null },
        { label: 'Tamalate', value: '920', icon: null },
        { label: 'Tammu-Tammu', value: '780', icon: null },
        { label: 'Tompo Balang', value: '720', icon: null },
        { label: 'Moncongloe Bulu', value: '550', icon: null }
      ];
      res.status(200).json(defaultData);
    }
  } catch (error) {
    console.error('Error fetching statistik from Supabase:', error);
    res.status(500).json({ message: 'Gagal mengambil data dari database.' });
  }
});

// API endpoint untuk MENYIMPAN (POST) statistik ke Supabase
app.post('/api/statistik', async (req, res) => {
  try {
    const statistikData = req.body;
    // Validasi sederhana untuk memastikan data yang diterima adalah array
    if (!Array.isArray(statistikData)) {
      return res.status(400).json({ message: 'Data yang dikirim harus berupa array.' });
    }

    if (supabase && supabaseStatus === 'configured') {
      // Use Supabase if available
      // Strategi Sinkronisasi: Hapus semua, lalu masukkan semua.
      // Ini memastikan data di database sama persis dengan yang dikirim dari UI, termasuk penghapusan.

      // 1. Hapus semua data statistik yang ada.
      const { error: deleteError } = await supabase
        .from('statistik')
        .delete()
        .neq('label', 'this-is-a-dummy-value-that-will-never-exist'); // Trik untuk menargetkan semua baris

      if (deleteError) throw deleteError;

      // 2. Masukkan semua data baru yang dikirim dari frontend.
      // Kita hanya insert jika ada data untuk menghindari error.
      if (statistikData && statistikData.length > 0) {
        const { error: insertError } = await supabase.from('statistik').insert(statistikData);
        if (insertError) throw insertError;
      }

      res.status(200).json({ message: 'Data statistik berhasil disinkronkan ke Supabase.' });
    } else {
      // Fallback: just return success without saving
      console.log('💾 Statistik data received (Supabase not available):', statistikData.length, 'items');
      res.status(200).json({ message: 'Data statistik diterima (Supabase tidak tersedia).' });
    }
  } catch (error) {
    console.error('Error syncing statistik to Supabase:', error);
    res.status(500).json({ message: 'Gagal menyinkronkan data ke database.' });
  }
});

// GET /api/prasarana endpoint
app.get('/api/prasarana', async (req, res) => {
  try {
    if (supabase && supabaseStatus === 'configured') {
      const { data, error } = await supabase
        .from('prasarana')
        .select('kategori, list')
        .order('kategori');
      
      if (error) throw error;
      
      // Convert JSONB back to array if needed
      const processedData = data ? data.map(item => ({
        kategori: item.kategori,
        list: Array.isArray(item.list) ? item.list : (item.list || [])
      })) : [];
      
      res.status(200).json(processedData);
    } else {
      // Fallback data jika Supabase tidak tersedia
      const fallbackData = [
        {
          kategori: 'Pendidikan',
          list: ['TK/PAUD (4 Unit)', 'SD Negeri (3 Unit)', 'SMP Negeri (1 Unit)'],
        },
        {
          kategori: 'Kesehatan',
          list: ['Puskesmas Pembantu (1 Unit)', 'Poskesdes (1 Unit)', 'Posyandu (5 Unit)'],
        },
        {
          kategori: 'Ibadah',
          list: ['Masjid (8 Unit)', 'Gereja (1 Unit)'],
        },
        {
          kategori: 'Umum',
          list: ['Kantor Desa (1 Unit)', 'Pasar Desa (1 Unit)', 'Lapangan Olahraga (2 Unit)'],
        },
      ];
      res.status(200).json(fallbackData);
    }
  } catch (error) {
    console.error('Error fetching prasarana:', error);
    res.status(500).json({ error: 'Gagal mengambil data prasarana' });
  }
});

// POST /api/prasarana endpoint
app.post('/api/prasarana', async (req, res) => {
  try {
    const prasaranaData = req.body;
    
    if (!Array.isArray(prasaranaData)) {
      return res.status(400).json({ error: 'Data harus berupa array' });
    }
    
    if (supabase && supabaseStatus === 'configured') {
      // Hapus semua data lama
      const { error: deleteError } = await supabase
        .from('prasarana')
        .delete()
        .neq('kategori', 'NON_EXISTENT_KATEGORI');
      
      if (deleteError) throw deleteError;
      
      // Insert data baru
      const { data, error: insertError } = await supabase
        .from('prasarana')
        .insert(prasaranaData)
        .select();
      
      if (insertError) throw insertError;
      
      res.status(200).json({ 
        message: 'Data prasarana berhasil disimpan ke database!', 
        data 
      });
    } else {
      res.status(503).json({ 
        error: 'Database tidak tersedia. Data hanya disimpan secara lokal.' 
      });
    }
  } catch (error) {
    console.error('Error saving prasarana:', error);
    res.status(500).json({ 
      error: `Gagal menyimpan data prasarana: ${error.message}` 
    });
  }
});

// GET /api/berita endpoint
app.get('/api/berita', async (req, res) => {
  try {
    if (supabase && supabaseStatus === 'configured') {
      const { data, error } = await supabase
        .from('berita')
        .select('*')
        .order('tanggal_publikasi', { ascending: false });
      
      if (error) throw error;
      
      res.status(200).json(data || []);
    } else {
      // Return empty array if Supabase is not available
      res.status(200).json([]);
    }
  } catch (error) {
    console.error('Error fetching berita:', error);
    res.status(500).json({ error: 'Gagal mengambil data berita' });
  }
});

// GET /api/berita/:id endpoint
app.get('/api/berita/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (supabase && supabaseStatus === 'configured') {
      const { data, error } = await supabase
        .from('berita')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        res.status(200).json(data);
      } else {
        res.status(404).json({ error: 'Berita tidak ditemukan' });
      }
    } else {
      res.status(503).json({ error: 'Database tidak tersedia' });
    }
  } catch (error) {
    console.error('Error fetching berita by id:', error);
    res.status(500).json({ error: 'Gagal mengambil data berita' });
  }
});

// POST /api/berita endpoint
app.post('/api/berita', async (req, res) => {
  try {
    const { judul, konten, gambar, penulis } = req.body;
    
    if (!judul || !konten) {
      return res.status(400).json({ error: 'Judul dan konten harus diisi' });
    }
    
    if (supabase && supabaseStatus === 'configured') {
      const beritaData = {
        judul,
        konten,
        gambar: gambar || null,
        penulis: penulis || 'Admin Desa',
        status: 'published'
      };
      
      const { data, error } = await supabase
        .from('berita')
        .insert(beritaData)
        .select()
        .single();
      
      if (error) throw error;
      
      res.status(201).json({ 
        message: 'Berita berhasil ditambahkan!', 
        data 
      });
    } else {
      res.status(503).json({ 
        error: 'Database tidak tersedia. Data hanya disimpan secara lokal.' 
      });
    }
  } catch (error) {
    console.error('Error creating berita:', error);
    res.status(500).json({ 
      error: `Gagal menambahkan berita: ${error.message}` 
    });
  }
});

// PUT /api/berita/:id endpoint
app.put('/api/berita/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { judul, konten, gambar, penulis, status } = req.body;
    
    if (!judul || !konten) {
      return res.status(400).json({ error: 'Judul dan konten harus diisi' });
    }
    
    if (supabase && supabaseStatus === 'configured') {
      const updateData = {
        judul,
        konten,
        gambar: gambar || null,
        penulis: penulis || 'Admin Desa',
        status: status || 'published',
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('berita')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        res.status(200).json({ 
          message: 'Berita berhasil diupdate!', 
          data 
        });
      } else {
        res.status(404).json({ error: 'Berita tidak ditemukan' });
      }
    } else {
      res.status(503).json({ 
        error: 'Database tidak tersedia. Data hanya disimpan secara lokal.' 
      });
    }
  } catch (error) {
    console.error('Error updating berita:', error);
    res.status(500).json({ 
      error: `Gagal mengupdate berita: ${error.message}` 
    });
  }
});

// DELETE /api/berita/:id endpoint
app.delete('/api/berita/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (supabase && supabaseStatus === 'configured') {
      const { error } = await supabase
        .from('berita')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      res.status(200).json({ 
        message: 'Berita berhasil dihapus!' 
      });
    } else {
      res.status(503).json({ 
        error: 'Database tidak tersedia.' 
      });
    }
  } catch (error) {
    console.error('Error deleting berita:', error);
    res.status(500).json({ 
      error: `Gagal menghapus berita: ${error.message}` 
    });
  }
});

// GET /api/pengaduan endpoint
app.get('/api/pengaduan', async (req, res) => {
  try {
    if (supabase && supabaseStatus === 'configured') {
      const { data, error } = await supabase
        .from('pengaduan')
        .select('*')
        .order('tanggal_pengaduan', { ascending: false });
      
      if (error) throw error;
      
      // Ensure all items have an id field
      if (data && data.length > 0) {
        
        // Ensure all items have an id field
        const validatedData = data.map(item => {
          if (!item.id) {
            console.warn('⚠️ Item missing ID field:', item);
            // Generate a temporary ID if missing
            return { ...item, id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
          }
          return item;
        });
        

        res.status(200).json(validatedData);
      } else {

        res.status(200).json([]);
      }
    } else {
      // Fallback data if Supabase is not available
      const fallbackData = [
        {
          id: '1',
          nama: 'John Doe',
          email: 'john@example.com',
          whatsapp: '081234567890',
          klasifikasi: 'pengaduan',
          judul: 'Jalan Rusak di Gang 3',
          isi: 'Jalan di depan rumah saya rusak parah, ada lubang besar yang membahayakan pengendara. Mohon diperbaiki segera.',
          tanggal_kejadian: '2024-01-15',
          kategori: 'Infrastruktur (Jalan, Jembatan, dll.)',
          lampiran_info: null,
          lampiran_data_url: null,
          status: 'pending',
          tanggal_pengaduan: new Date().toISOString(),
          tanggal_ditangani: null,
          catatan_admin: null
        }
      ];
      
      // Ensure fallback data has ID field
      const validatedFallbackData = fallbackData.map(item => {
        if (!item.id) {
          console.warn('⚠️ Fallback item missing ID field:', item);
          return { ...item, id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
        }
        return item;
      });
      
      res.status(200).json(validatedFallbackData);
    }
  } catch (error) {
    console.error('Error fetching pengaduan:', error);
    res.status(500).json({ error: 'Gagal mengambil data pengaduan' });
  }
});

// GET /api/pengaduan/:id endpoint
app.get('/api/pengaduan/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (supabase && supabaseStatus === 'configured') {
      const { data, error } = await supabase
        .from('pengaduan')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) {
        return res.status(404).json({ error: 'Pengaduan tidak ditemukan' });
      }
      res.status(200).json(data);
    } else {
      res.status(404).json({ error: 'Pengaduan tidak ditemukan' });
    }
  } catch (error) {
    console.error('Error fetching pengaduan by ID:', error);
    res.status(500).json({ error: 'Gagal mengambil data pengaduan' });
  }
});

// POST /api/pengaduan endpoint
app.post('/api/pengaduan', async (req, res) => {
  try {
    console.log('📥 Received pengaduan data:', {
      hasJudul: !!req.body.judul,
      hasIsi: !!req.body.isi,
      hasKategori: !!req.body.kategori,
      hasLampiran: !!req.body.lampiran_data_url,
      lampiranSize: req.body.lampiran_data_url ? req.body.lampiran_data_url.length : 0,
      supabaseStatus,
      bodyKeys: Object.keys(req.body)
    });

    const { 
      nama, 
      email, 
      whatsapp, 
      klasifikasi, 
      judul, 
      isi, 
      tanggal_kejadian, 
      kategori, 
      lampiran_info, 
      lampiran_data_url,
      tracking 
    } = req.body;
    
    // Validasi input
    if (!judul || !isi || !kategori) {
      console.log('❌ Validation failed:', { judul: !!judul, isi: !!isi, kategori: !!kategori });
      return res.status(400).json({ error: 'Judul, isi, dan kategori harus diisi' });
    }
    
    if (supabase && supabaseStatus === 'configured') {
      console.log('🗄️ Using Supabase for storage');
      console.log('📋 Pengaduan upload details:', {
        hasLampiran: !!lampiran_data_url,
        lampiranSize: lampiran_data_url ? lampiran_data_url.length : 0,
        lampiranType: lampiran_type,
        storageMethod: 'database_json' // Pengaduan tidak pakai storage bucket
      });
      
      // Hitung ukuran lampiran jika ada
      const lampiran_size = lampiran_data_url ? lampiran_data_url.length : null;
      const lampiran_type = lampiran_info ? getMimeType(lampiran_info) : null;
      
      const pengaduanData = {
        nama: nama || 'Anonim',
        email: email || null,
        whatsapp: whatsapp || null,
        klasifikasi: klasifikasi || 'pengaduan',
        judul,
        isi,
        tanggal_kejadian: tanggal_kejadian || null,
        kategori,
        lampiran_info: lampiran_info || null,
        lampiran_data_url: lampiran_data_url || null,
        lampiran_size,
        lampiran_type,
        status: 'pending',
        // Tracking data - hanya IP address
        client_ip: tracking?.clientIP || null,
        user_agent: tracking?.deviceInfo?.userAgent || null,
        device_info: tracking?.deviceInfo ? JSON.stringify(tracking.deviceInfo) : null,
        session_id: tracking?.sessionId || null,
        form_submission_time: tracking?.formSubmissionTime || null,
        form_filling_duration: tracking?.formFillingDuration || null
      };
      
      console.log('💾 Inserting data to Supabase...');

      
      const { data, error } = await supabase
        .from('pengaduan')
        .insert([pengaduanData])
        .select();
      
      if (error) {
        console.error('❌ Supabase error:', error);
        
        // Handle specific Supabase errors
        if (error.code === 'PGRST116') {
          return res.status(400).json({ error: 'Data yang dikirim tidak valid. Silakan periksa kembali form Anda.' });
        } else if (error.code === '23505') {
          return res.status(409).json({ error: 'Data duplikat terdeteksi. Silakan coba lagi.' });
        } else if (error.code === '42P01') {
          return res.status(500).json({ error: 'Tabel database tidak ditemukan. Hubungi administrator.' });
        } else if (error.message && error.message.includes('JWT')) {
          return res.status(401).json({ error: 'Koneksi database tidak valid. Hubungi administrator.' });
        } else {
          return res.status(500).json({ error: 'Gagal menyimpan pengaduan ke database' });
        }
      }
      
      console.log('✅ Data saved to Supabase successfully');
      
      // Kirim notifikasi email ke desa
      try {
        const desaEmails = process.env.DESA_EMAIL_RECIPIENTS 
          ? process.env.DESA_EMAIL_RECIPIENTS.split(',').map(email => email.trim())
          : ['moncongloebulu.desa@gmail.com']; // Default email
        
        console.log('📧 Sending email notification to:', desaEmails);
        
        // Kirim notifikasi email
        const emailResult = await sendPengaduanNotificationToMultiple(data[0], desaEmails);
        
        if (emailResult.success) {
          console.log('✅ Email notification sent successfully');
        } else {
          console.warn('⚠️ Failed to send email notification:', emailResult.error);
        }
      } catch (emailError) {
        console.warn('⚠️ Error sending email notification:', emailError.message);
        // Jangan gagalkan response jika email gagal
      }
      
      // Ensure the returned data has a valid ID
      const returnedData = data[0];
      if (!returnedData.id) {
        console.warn('⚠️ Supabase returned data without ID:', returnedData);
        returnedData.id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      res.status(201).json({ 
        message: 'Pengaduan berhasil disimpan', 
        data: returnedData 
      });
    } else {
      console.log('📦 Using fallback storage (Supabase not available)');
      
      // Fallback jika Supabase tidak tersedia
      const pengaduanData = {
        nama: nama || 'Anonim',
        email: email || null,
        whatsapp: whatsapp || null,
        klasifikasi: klasifikasi || 'pengaduan',
        judul,
        isi,
        tanggal_kejadian: tanggal_kejadian || null,
        kategori,
        lampiran_info: lampiran_info || null,
        lampiran_data_url: lampiran_data_url || null,
        lampiran_size: lampiran_data_url ? lampiran_data_url.length : null,
        lampiran_type: lampiran_info ? getMimeType(lampiran_info) : null,
        status: 'pending',
        client_ip: tracking?.clientIP || null,
        user_agent: tracking?.deviceInfo?.userAgent || null,
        device_info: tracking?.deviceInfo ? JSON.stringify(tracking.deviceInfo) : null,
        session_id: tracking?.sessionId || null,
        form_submission_time: tracking?.formSubmissionTime || null,
        form_filling_duration: tracking?.formFillingDuration || null,
        tanggal_pengaduan: new Date().toISOString()
      };
      
      console.log('✅ Data processed successfully (fallback mode)');
      
      // Kirim notifikasi email ke desa (fallback mode)
      try {
        const desaEmails = process.env.DESA_EMAIL_RECIPIENTS 
          ? process.env.DESA_EMAIL_RECIPIENTS.split(',').map(email => email.trim())
          : ['moncongloebulu.desa@gmail.com']; // Default email
        
        console.log('📧 Sending email notification (fallback mode) to:', desaEmails);
        
        // Kirim notifikasi email
        const emailResult = await sendPengaduanNotificationToMultiple(pengaduanData, desaEmails);
        
        if (emailResult.success) {
          console.log('✅ Email notification sent successfully (fallback mode)');
        } else {
          console.warn('⚠️ Failed to send email notification (fallback mode):', emailResult.error);
        }
      } catch (emailError) {
        console.warn('⚠️ Error sending email notification (fallback mode):', emailResult.error);
        // Jangan gagalkan response jika email gagal
      }
      
      // Ensure fallback data has a valid ID
      if (!pengaduanData.id) {
        pengaduanData.id = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      res.status(201).json({ 
        message: 'Pengaduan berhasil diproses (database tidak tersedia)', 
        data: pengaduanData 
      });
    }
  } catch (error) {
    console.error('❌ Error in POST /api/pengaduan:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// PUT /api/pengaduan/:id endpoint
app.put('/api/pengaduan/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, catatan_admin } = req.body;
    
    if (supabase && supabaseStatus === 'configured') {
      const updateData = {};
      if (status) updateData.status = status;
      if (catatan_admin !== undefined) updateData.catatan_admin = catatan_admin;
      if (status === 'selesai') updateData.tanggal_ditangani = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('pengaduan')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      if (!data) {
        return res.status(404).json({ error: 'Pengaduan tidak ditemukan' });
      }
      
      res.status(200).json({ 
        message: 'Pengaduan berhasil diupdate!', 
        data 
      });
    } else {
      res.status(404).json({ error: 'Pengaduan tidak ditemukan' });
    }
  } catch (error) {
    console.error('Error updating pengaduan:', error);
    res.status(500).json({ error: 'Gagal mengupdate pengaduan' });
  }
});

// DELETE /api/pengaduan/:id endpoint
app.delete('/api/pengaduan/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Debug: Log the ID parameter received
    console.log('🔍 DELETE request received for ID:', id);
    console.log('🔍 ID type:', typeof id);
    console.log('🔍 ID value:', id);
    
    if (supabase && supabaseStatus === 'configured') {
      const { error } = await supabase
        .from('pengaduan')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      res.status(200).json({ message: 'Pengaduan berhasil dihapus!' });
    } else {
      res.status(404).json({ error: 'Pengaduan tidak ditemukan' });
    }
  } catch (error) {
    console.error('Error deleting pengaduan:', error);
    res.status(500).json({ error: 'Gagal menghapus pengaduan' });
  }
});

// Endpoint untuk mendapatkan statistik lampiran
app.get('/api/pengaduan/stats/lampiran', async (req, res) => {
  try {
    if (supabase && supabaseStatus === 'configured') {
      // Simple stats without complex queries
      const { data, error } = await supabase
        .from('pengaduan')
        .select('lampiran_data_url, lampiran_size');
      
      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Gagal mengambil statistik lampiran' });
      }
      
      const totalPengaduan = data.length;
      const withLampiran = data.filter(p => p.lampiran_data_url).length;
      const withoutLampiran = totalPengaduan - withLampiran;
      const avgSize = withLampiran > 0 
        ? Math.round(data.filter(p => p.lampiran_size).reduce((sum, p) => sum + (p.lampiran_size || 0), 0) / withLampiran)
        : 0;
      const maxSize = withLampiran > 0 
        ? Math.max(...data.filter(p => p.lampiran_size).map(p => p.lampiran_size || 0))
        : 0;
      
      res.json({
        total_pengaduan: totalPengaduan,
        with_lampiran: withLampiran,
        without_lampiran: withoutLampiran,
        avg_size: avgSize,
        max_size: maxSize,
        compressed_count: 0, // Not available in current schema
        uncompressed_count: withLampiran
      });
    } else {
      // Fallback untuk localStorage
      const storedPengaduan = JSON.parse(localStorage.getItem('pengaduan') || '[]');
      const withLampiran = storedPengaduan.filter(p => p.lampiran_data_url).length;
      const withoutLampiran = storedPengaduan.length - withLampiran;
      
      res.json({
        total_pengaduan: storedPengaduan.length,
        with_lampiran: withLampiran,
        without_lampiran: withoutLampiran,
        avg_size: 0,
        max_size: 0,
        compressed_count: 0,
        uncompressed_count: withLampiran
      });
    }
  } catch (error) {
    console.error('Error in GET /api/pengaduan/stats/lampiran:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Endpoint untuk mendapatkan pengaduan dengan risk score tinggi
app.get('/api/pengaduan/high-risk', async (req, res) => {
  try {
    const { threshold = 50 } = req.query;
    
    if (supabase && supabaseStatus === 'configured') {
      const { data, error } = await supabase
        .from('pengaduan')
        .select('id, nama, judul, risk_score, verification_status, tanggal_pengaduan')
        .gte('risk_score', parseInt(threshold))
        .order('risk_score', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Gagal mengambil data pengaduan berisiko tinggi' });
      }
      
      const highRiskPengaduan = (data || []).map(p => ({
        id: p.id,
        nama: p.nama,
        judul: p.judul,
        risk_score: p.risk_score || 0,
        verification_status: p.verification_status || 'unverified',
        created_at: p.tanggal_pengaduan
      }));
      
      res.json(highRiskPengaduan);
    } else {
      // Fallback untuk localStorage
      const storedPengaduan = JSON.parse(localStorage.getItem('pengaduan') || '[]');
      const highRiskPengaduan = storedPengaduan
        .filter(p => (p.risk_score || 0) >= parseInt(threshold))
        .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
        .map(p => ({
          id: p.id,
          nama: p.nama,
          judul: p.judul,
          risk_score: p.risk_score || 0,
          verification_status: p.verification_status || 'unverified',
          created_at: p.tanggal_pengaduan
        }));
      
      res.json(highRiskPengaduan);
    }
  } catch (error) {
    console.error('Error in GET /api/pengaduan/high-risk:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Endpoint untuk mendapatkan statistik pengaduan berdasarkan periode
app.get('/api/pengaduan/stats/period', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (supabase && supabaseStatus === 'configured') {
      let query = supabase
        .from('pengaduan')
        .select('*');
      
      if (start_date && end_date) {
        query = query
          .gte('tanggal_pengaduan', start_date)
          .lte('tanggal_pengaduan', end_date);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Gagal mendapatkan statistik' });
      }
      
      const stats = {
        total: data.length,
        pengaduan: data.filter(p => p.klasifikasi === 'pengaduan').length,
        aspirasi: data.filter(p => p.klasifikasi === 'aspirasi').length,
        pending: data.filter(p => p.status === 'pending').length,
        proses: data.filter(p => p.status === 'proses').length,
        selesai: data.filter(p => p.status === 'selesai').length,
        with_attachment: data.filter(p => p.lampiran_data_url).length,
        without_attachment: data.filter(p => !p.lampiran_data_url).length
      };
      
      res.json(stats);
    } else {
      // Fallback untuk localStorage
      const storedPengaduan = JSON.parse(localStorage.getItem('pengaduan') || '[]');
      const filteredData = storedPengaduan.filter(p => {
        if (!start_date || !end_date) return true;
        const reportDate = new Date(p.tanggal_pengaduan);
        const start = new Date(start_date);
        const end = new Date(end_date);
        return reportDate >= start && reportDate <= end;
      });
      
      const stats = {
        total: filteredData.length,
        pengaduan: filteredData.filter(p => p.klasifikasi === 'pengaduan').length,
        aspirasi: filteredData.filter(p => p.klasifikasi === 'aspirasi').length,
        pending: filteredData.filter(p => p.status === 'pending').length,
        proses: filteredData.filter(p => p.status === 'proses').length,
        selesai: filteredData.filter(p => p.status === 'selesai').length,
        with_attachment: filteredData.filter(p => p.lampiran_data_url).length,
        without_attachment: filteredData.filter(p => !p.lampiran_data_url).length
      };
      
      res.json(stats);
    }
  } catch (error) {
    console.error('Error getting period stats:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Endpoint untuk export data pengaduan
app.get('/api/pengaduan/export', async (req, res) => {
  try {
    const { start_date, end_date, status_filter } = req.query;
    
    if (supabase && supabaseStatus === 'configured') {
      let query = supabase
        .from('pengaduan')
        .select('*');
      
      if (start_date) {
        query = query.gte('tanggal_pengaduan', start_date);
      }
      if (end_date) {
        query = query.lte('tanggal_pengaduan', end_date);
      }
      if (status_filter) {
        query = query.eq('status', status_filter);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Gagal export data pengaduan' });
      }
      
      const exportData = (data || []).map(p => ({
        id: p.id,
        nama: p.nama,
        email: p.email,
        whatsapp: p.whatsapp,
        klasifikasi: p.klasifikasi,
        judul: p.judul,
        kategori: p.kategori,
        status: p.status,
        tanggal_pengaduan: p.tanggal_pengaduan,
        tanggal_ditangani: p.tanggal_ditangani,
        risk_score: p.risk_score || 0,
        verification_status: p.verification_status || 'unverified',
        lampiran_info: p.lampiran_info,
        lampiran_size: p.lampiran_size
      }));
      
      res.json(exportData);
    } else {
      // Fallback untuk localStorage
      const storedPengaduan = JSON.parse(localStorage.getItem('pengaduan') || '[]');
      let filteredPengaduan = storedPengaduan;
      
      if (start_date || end_date) {
        filteredPengaduan = storedPengaduan.filter(p => {
          const pengaduanDate = new Date(p.tanggal_pengaduan);
          const start = start_date ? new Date(start_date) : new Date(0);
          const end = end_date ? new Date(end_date) : new Date();
          return pengaduanDate >= start && pengaduanDate <= end;
        });
      }
      
      if (status_filter) {
        filteredPengaduan = filteredPengaduan.filter(p => p.status === status_filter);
      }
      
      const exportData = filteredPengaduan.map(p => ({
        id: p.id,
        nama: p.nama,
        email: p.email,
        whatsapp: p.whatsapp,
        klasifikasi: p.klasifikasi,
        judul: p.judul,
        kategori: p.kategori,
        status: p.status,
        tanggal_pengaduan: p.tanggal_pengaduan,
        tanggal_ditangani: p.tanggal_ditangani,
        risk_score: p.risk_score || 0,
        verification_status: p.verification_status || 'unverified',
        lampiran_info: p.lampiran_info,
        lampiran_size: p.lampiran_size
      }));
      
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error in GET /api/pengaduan/export:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// API endpoint untuk MENGAMBIL (GET) dokumentasi KKN
app.get('/api/dokumentasi', async (req, res) => {
  try {
    if (supabase && supabaseStatus === 'configured') {
      // Use Supabase if available
      const { data, error } = await supabase
        .from('dokumentasi_kkn')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      res.status(200).json(data || []);
    } else {
      // Fallback: return default data untuk development
      console.log('📚 Returning development dokumentasi data');
      const defaultData = [
        {
          id: 1,
          title: 'Template BUMDes',
          description: 'Template spreadsheet untuk pengelolaan BUMDes yang sudah siap digunakan',
          category: 'template',
          author: 'KKN-T 114',
          downloads: 0,
          file_url: '#',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          title: 'Modul Pelatihan UMKM',
          description: 'Modul pelatihan untuk pengembangan usaha mikro, kecil, dan menengah',
          category: 'modul',
          author: 'KKN-T 114',
          downloads: 0,
          file_url: '#',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 3,
          title: 'Buku Panduan Desa Digital',
          description: 'Panduan lengkap untuk implementasi teknologi digital di desa',
          category: 'buku_panduan',
          author: 'KKN-T 114',
          downloads: 0,
          file_url: '#',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];
      res.status(200).json(defaultData);
    }
  } catch (error) {
    console.error('Error in GET /api/dokumentasi:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// API endpoint untuk MENAMBAHKAN (POST) dokumentasi baru
app.post('/api/dokumentasi', async (req, res) => {
  try {
    const { title, description, category, author, download_url, thumbnail_url } = req.body;
    
    // Validasi input
    if (!title || !description || !category || !author || !download_url) {
      return res.status(400).json({ error: 'Title, description, category, author, dan download_url harus diisi' });
    }

    if (supabase && supabaseStatus === 'configured') {
      const dokumentasiData = {
        title,
        description,
        category,
        author,
        download_url: download_url, // Use download_url directly
        thumbnail_url: thumbnail_url || null,
        downloads: 0,
        is_active: true,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('dokumentasi_kkn')
        .insert([dokumentasiData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Gagal menambahkan dokumentasi ke database' });
      }

      res.status(201).json({ 
        message: 'Dokumentasi berhasil ditambahkan!', 
        data 
      });
    } else {
      // Fallback untuk development
      console.log('📚 Adding dokumentasi (development mode)');
      const dokumentasiData = {
        id: Date.now(),
        title,
        description,
        category,
        author,
        download_url: download_url,
        thumbnail_url: thumbnail_url || null,
        downloads: 0,
        is_active: true,
        created_at: new Date().toISOString()
      };
      
      res.status(201).json({ 
        message: 'Dokumentasi berhasil ditambahkan (development mode)!', 
        data: dokumentasiData 
      });
    }
  } catch (error) {
    console.error('Error in POST /api/dokumentasi:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// API endpoint untuk INCREMENT download count dokumentasi
app.post('/api/dokumentasi/download', async (req, res) => {
  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'ID dokumentasi diperlukan' });
    }

    if (supabase && supabaseStatus === 'configured') {
      // Use Supabase RPC function if available
      const { error } = await supabase.rpc('increment_dokumentasi_downloads', {
        doc_id: id
      });

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Gagal update download count' });
      }

      res.status(200).json({ success: true });
    } else {
      // Fallback untuk development - just return success
      console.log('📚 Download count increment (development mode)');
      res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error('Error in POST /api/dokumentasi/download:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// API endpoint untuk UPDATE dokumentasi
app.put('/api/dokumentasi/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, author, download_url, thumbnail_url } = req.body;
    
    // Validasi input
    if (!title || !description || !category || !author || !download_url) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    if (supabase && supabaseStatus === 'configured') {
      // Update dokumentasi di Supabase
      const { data, error } = await supabase
        .from('dokumentasi_kkn')
        .update({
          title,
          description,
          category,
          author,
          download_url,
          thumbnail_url: thumbnail_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Gagal update dokumentasi di database' });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Dokumentasi tidak ditemukan' });
      }

      res.status(200).json({ 
        message: 'Dokumentasi berhasil diupdate!', 
        data: data[0] 
      });
    } else {
      // Fallback untuk development
      console.log('📚 Updating dokumentasi (development mode)');
      const updatedData = {
        id: parseInt(id),
        title,
        description,
        category,
        author,
        download_url,
        thumbnail_url: thumbnail_url || null,
        updated_at: new Date().toISOString()
      };
      
      res.status(200).json({ 
        message: 'Dokumentasi berhasil diupdate (development mode)!', 
        data: updatedData 
      });
    }
  } catch (error) {
    console.error('Error in PUT /api/dokumentasi/:id:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// API endpoint untuk DELETE dokumentasi
app.delete('/api/dokumentasi/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (supabase && supabaseStatus === 'configured') {
      // Delete dokumentasi dari Supabase
      const { error } = await supabase
        .from('dokumentasi_kkn')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Gagal menghapus dokumentasi dari database' });
      }

      res.status(200).json({ 
        message: 'Dokumentasi berhasil dihapus!' 
      });
    } else {
      // Fallback untuk development
      console.log('📚 Deleting dokumentasi (development mode)');
      res.status(200).json({ 
        message: 'Dokumentasi berhasil dihapus (development mode)!' 
      });
    }
  } catch (error) {
    console.error('Error in DELETE /api/dokumentasi/:id:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});



// Jalankan server di semua environment
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET  /api/health - Health check`);

  console.log(`   GET  /api/statistik - Get statistik data`);
  console.log(`   POST /api/statistik - Save statistik data`);
  console.log(`   GET  /api/dokumentasi - Get dokumentasi data`);
  console.log(`   POST /api/dokumentasi - Add new dokumentasi`);
  console.log(`   PUT  /api/dokumentasi/:id - Update dokumentasi`);
  console.log(`   DELETE /api/dokumentasi/:id - Delete dokumentasi`);
  console.log(`   POST /api/dokumentasi/download - Increment download count`);
  console.log(`📧 Email System: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}`);
  console.log(`🔧 Supabase Status: ${supabaseStatus}`);
});

module.exports = app;

// Helper function untuk mendapatkan MIME type
function getMimeType(filename) {
  if (!filename) return 'application/octet-stream';
  
  const ext = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}