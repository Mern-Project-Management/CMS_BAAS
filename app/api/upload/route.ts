import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { requireAuth } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';
import { v2 } from 'cloudinary';

// Cloudinary configuration - use URL format for reliability
if (process.env.CLOUDINARY_URL) {
  v2.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
  });
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Get allowed MIME types based on field type
function getAllowedMimeTypes(fieldType: string): string[] {
  switch (fieldType.toLowerCase()) {
    case 'image':
      return [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/bmp',
        'image/tiff',
      ];
    case 'file':
      return [
        // Images
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/bmp',
        'image/tiff',
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // Videos
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm',
        'video/x-matroska',
        // Audio
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'audio/webm',
        // Text
        'text/plain',
        'text/csv',
        // Archives
        'application/zip',
        'application/x-rar-compressed',
        'application/x-tar',
        'application/gzip',
      ];
    default:
      return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fieldType = formData.get('fieldType') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Validate file type based on field type
    const allowedTypes = getAllowedMimeTypes(fieldType);
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `File type ${file.type} not allowed for ${fieldType} field. Allowed types: ${allowedTypes.join(', ')}`,
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Check if Cloudinary is configured
    const isCloudinaryConfigured = 
      process.env.CLOUDINARY_URL || 
      (process.env.CLOUDINARY_CLOUD_NAME && 
       process.env.CLOUDINARY_API_KEY && 
       process.env.CLOUDINARY_API_SECRET);

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const ext = file.name.split('.').pop() || '';
    const filename = `${timestamp}-${randomStr}.${ext}`;

    const bytes = await file.arrayBuffer();

    let publicUrl: string;

    if (isCloudinaryConfigured) {
      // Upload to Cloudinary
      const buffer = Buffer.from(bytes);
      const base64Image = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64Image}`;

      const result = await v2.uploader.upload(dataUrl, {
        folder: 'jayshree_cms',
        resource_type: 'auto',
        public_id: filename.replace(`.${ext}`, ''),
        overwrite: false,
        invalidate: true,
      }).catch((err) => {
        console.error('Cloudinary upload error:', err);
        throw err;
      });

      publicUrl = result.secure_url;
    } else {
      // Fallback: Save locally (for local development)
      await ensureUploadDir();
      const filepath = join(UPLOAD_DIR, filename);
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);
      publicUrl = `/uploads/${filename}`;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          url: publicUrl,
          filename: file.name,
          size: file.size,
          type: file.type,
        },
        message: 'File uploaded successfully',
      } as ApiResponse<any>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    // Log error details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as ApiResponse<null>,
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to upload file' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
