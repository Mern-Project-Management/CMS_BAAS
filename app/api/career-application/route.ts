import { NextRequest, NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/mail';
import { createRecord , getRecords  } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface CareerApplicationData {
  name: string;
  email: string;
  phone?: string;
  position: string;
  coverLetter?: string;
  cv_url?: string;
}

// ✅ NEW: GET — fetch applications with optional filters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const position = searchParams.get('position');
  const email = searchParams.get('email');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const filters: Record<string, any> = {};
    if (position) filters.position = position;
    if (email) filters.email = email;

    // Call getRecords with correct signature: collectionName, limit, filter, projection
    const { data, error } = await getRecords('career_applications', limit, filters);
    console.log("data", data)
    if (error) {
      console.error('Failed to fetch career applications:', error);
      const errorResponse = NextResponse.json(
        { success: false, error: 'Failed to fetch applications' },
        { status: 500 }
      );
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      return errorResponse;
    }

    const successResponse = NextResponse.json({
      success: true,
      data: data || [],
      pagination: { limit, offset, total: (data || []).length },
    });
    successResponse.headers.set('Access-Control-Allow-Origin', '*');
    return successResponse;

  } catch (error: any) {
    console.error('Career Application GET Error:', error);
    const errorResponse = NextResponse.json(
      { success: false, error: 'Failed to fetch applications' },
      { status: 500 }
    );
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}


const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Upload file locally and return public URL
async function uploadFileToLocal(file: File): Promise<string> {
  await ensureUploadDir();
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const ext = file.name.split('.').pop() || '';
  const filename = `${timestamp}-${randomStr}.${ext}`;
  const filepath = join(UPLOAD_DIR, filename);
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filepath, buffer);
  return `/uploads/${filename}`;
}

// Career application email template for admin/owner
const adminHtmlContent = (data: CareerApplicationData) => `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; line-height: 1.6; margin: 0; padding: 0; background-color: #0a0a0a; }
      .container { max-width: 600px; margin: 40px auto; background: #111; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5); border: 1px solid #D4AF3720; }
      .header { background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border-bottom: 2px solid #D4AF3740; padding: 40px 20px; text-align: center; }
      .header h1 { margin: 0; font-size: 22px; font-weight: 700; color: #D4AF37; text-transform: uppercase; letter-spacing: 3px; font-family: 'Playfair Display', serif; }
      .icon { font-size: 48px; margin-bottom: 10px; color: #D4AF37; }
      .content { padding: 40px; }
      .field-group { margin-bottom: 24px; }
      .label { display: block; font-size: 11px; font-weight: 700; color: #D4AF37; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
      .value { font-size: 15px; color: #e2e8f0; padding: 14px 18px; background: linear-gradient(90deg, #1a1a1a 0%, #0f0f0f 100%); border-radius: 8px; border-left: 4px solid #D4AF37; }
      .footer { background: linear-gradient(135deg, #0a0a0a 0%, #050505 100%); border-top: 1px solid #D4AF3720; padding: 28px; text-align: center; font-size: 12px; color: #D4AF3780; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="icon">💼</div>
        <h1>New Career Application</h1>
      </div>
      <div class="content">
        <div class="field-group">
          <span class="label">Applicant Name</span>
          <div class="value">${data.name}</div>
        </div>
        <div class="field-group">
          <span class="label">Email Address</span>
          <div class="value">${data.email}</div>
        </div>
        <div class="field-group">
          <span class="label">Phone Number</span>
          <div class="value">${data.phone || 'Not provided'}</div>
        </div>
        <div class="field-group">
          <span class="label">Position Applied For</span>
          <div class="value">${data.position}</div>
        </div>
        <div class="field-group">
          <span class="label">Cover Letter</span>
          <div class="value" style="white-space: pre-wrap;">${data.coverLetter || 'Not provided'}</div>
        </div>
      </div>
      <div class="footer">
        This is an automated notification from your website's career application form.<br>
        &copy; ${new Date().getFullYear()} Bexon Manufacturing. All rights reserved.
      </div>
    </div>
  </body>
  </html>
`;

// Thank you email template for applicant
const clientHtmlContent = (data: CareerApplicationData) => `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; line-height: 1.6; margin: 0; padding: 0; background-color: #0a0a0a; }
      .container { max-width: 600px; margin: 40px auto; background: #111; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5); border: 1px solid #D4AF3720; }
      .header { background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border-bottom: 2px solid #D4AF3740; padding: 40px 20px; text-align: center; }
      .header h1 { margin: 0; font-size: 24px; font-weight: 700; color: #D4AF37; text-transform: uppercase; letter-spacing: 2px; font-family: 'Playfair Display', serif; }
      .icon { font-size: 60px; margin-bottom: 15px; color: #D4AF37; }
      .content { padding: 40px; }
      .intro { font-size: 16px; color: #cbd5e1; line-height: 1.8; margin-bottom: 30px; text-align: center; }
      .details { background: linear-gradient(90deg, #1a1a1a 0%, #0f0f0f 100%); border-radius: 10px; padding: 24px; border: 1px solid #D4AF3720; margin-bottom: 30px; }
      .detail-item { margin-bottom: 16px; }
      .detail-label { color: #D4AF37; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
      .detail-value { color: #e2e8f0; font-size: 15px; }
      .cta { text-align: center; margin-top: 30px; padding: 20px; background: #0a0a0a; border-radius: 10px; border: 1px solid #D4AF3720; }
      .cta-text { color: #94a3b8; font-size: 14px; margin-bottom: 16px; }
      .cta-button { display: inline-block; padding: 14px 36px; background: #D4AF37; color: #0a0a0a; text-decoration: none; font-weight: 700; border-radius: 6px; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; }
      .footer { background: linear-gradient(135deg, #0a0a0a 0%, #050505 100%); border-top: 1px solid #D4AF3720; padding: 28px; text-align: center; font-size: 12px; color: #D4AF3780; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="icon">🎉</div>
        <h1>Application Received!</h1>
      </div>
      <div class="content">
        <p class="intro">Thank you for your interest, <strong>${data.name}</strong>! Your application for <strong>${data.position}</strong> has been successfully received.</p>
        
        <div class="details">
          <div class="detail-item">
            <div class="detail-label">Position Applied For</div>
            <div class="detail-value">${data.position}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Your Email</div>
            <div class="detail-value">${data.email}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Phone Number</div>
            <div class="detail-value">${data.phone || 'Not provided'}</div>
          </div>
        </div>

        <p style="text-align: center; color: #cbd5e1; line-height: 1.8; margin-bottom: 20px;">
          Our HR team will review your application and get back to you shortly if your profile matches our requirements.
        </p>

        <div class="cta">
          <p class="cta-text">Have questions about the position?</p>
          <a href="mailto:harshit.dhodi2108@gmail.com" class="cta-button">Contact HR</a>
        </div>
      </div>
      <div class="footer">
        This is an automated confirmation from Bexon Manufacturing.<br>
        &copy; ${new Date().getFullYear()} Bexon Manufacturing. All rights reserved.
      </div>
    </div>
  </body>
  </html>
`;

interface CareerApplicationData {
  name: string;
  email: string;
  phone?: string;
  position: string;
  coverLetter?: string;
  cv_url?: string;
}

export async function POST(request: NextRequest) {
  // Add CORS headers
  const response = NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    return response;
  }

  if (request.method !== 'POST') {
    return response;
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    
    let body: CareerApplicationData;
    let cvUrl = '';
    
    // Handle multipart form data (for file uploads)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const name = formData.get('name') as string;
      const email = formData.get('email') as string;
      const phone = formData.get('phone') as string;
      const position = formData.get('position') as string;
      const coverLetter = formData.get('coverLetter') as string;
      const cvFile = formData.get('cv_file') as File;

      if (!name || !email || !position) {
        const errorResponse = NextResponse.json({ success: false, error: 'Name, email, and position are required' }, { status: 400 });
        errorResponse.headers.set('Access-Control-Allow-Origin', '*');
        return errorResponse;
      }

      // Upload CV file if provided
      if (cvFile && cvFile.size > 0) {
        try {
          cvUrl = await uploadFileToLocal(cvFile);
        } catch (uploadError) {
          console.error('Failed to upload CV file:', uploadError);
        }
      }

      body = {
        name,
        email,
        phone: phone || '',
        position,
        coverLetter: coverLetter || '',
        cv_url: cvUrl,
      };
    } else {
      // Handle JSON body
      try {
        body = await request.json();
      } catch (e) {
        const errorResponse = NextResponse.json({ success: false, error: 'Invalid request format' }, { status: 400 });
        errorResponse.headers.set('Access-Control-Allow-Origin', '*');
        return errorResponse;
      }
    }

    // Validate required fields
    const { name, email, position } = body;
    
    if (!name || !email || !position) {
      const errorResponse = NextResponse.json({ success: false, error: 'Name, email, and position are required' }, { status: 400 });
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      return errorResponse;
    }

    // Save application to database
    const { error: dbError } = await createRecord('career_applications', {
      name,
      email,
      phone: body.phone || '',
      position,
      coverLetter: body.coverLetter || '',
      cv_url: body.cv_url || '',
      applied_at: new Date().toISOString(),
    });
    
    if (dbError) {
      console.error('Failed to save career application:', dbError);
      // Continue sending email even if DB save fails
    }

    // Send emails
    const adminEmail = process.env.EMAIL_USER || 'harshit.dhodi2108@gmail.com';
    const adminPass = process.env.EMAIL_PASS || 'jnkb ytek ilqm ryfm';

    try {
      // Admin notification
      await sendContactEmail({
        name,
        email,
        service_id: position,
        message: body.coverLetter || `Application for ${position} position`,
      });

      // Client thank you email (custom template)
      await (async () => {
        // @ts-ignore
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: adminEmail,
            pass: adminPass,
          },
        });

        await transporter.sendMail({
          from: `"Bexon Manufacturing" <${adminEmail}>`,
          to: email,
          subject: `Thank you for your application - ${position}`,
          replyTo: adminEmail,
          html: clientHtmlContent(body),
        });
      })();

    } catch (emailError: any) {
      console.error('Failed to send emails:', emailError);
    }

    const successResponse = NextResponse.json({ 
      success: true, 
      message: 'Application submitted successfully. We will contact you soon.' 
    });
    successResponse.headers.set('Access-Control-Allow-Origin', '*');
    return successResponse;

  } catch (error: any) {
    console.error('Career Application API Error:', error);
    const errorResponse = NextResponse.json({ success: false, error: 'Failed to submit application' }, { status: 500 });
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}

export async function OPTIONS(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
