import { NextRequest, NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/mail';
import { createRecord } from '@/lib/db'; // Import createRecord

export async function POST(_request: NextRequest) {
  // Add CORS headers for all responses
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
    let body;
    try {
      body = await request.json();
    } catch (e) {
      const errorResponse = NextResponse.json({ success: false, error: 'Invalid request format' }, { status: 400 });
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      return errorResponse;
    }

    // Destructure service_id or service (to match your payload)
    const { name, email, message } = body;
    const service_id = body.service_id || body.service;

    if (!name || !email || !service_id || !message) {
      console.warn('⚠️ Contact form validation failed. Missing fields:', { name: !!name, email: !!email, service: !!service_id, msg: !!message });
      const errorResponse = NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      return errorResponse;
    }

    // Save contact form data to the 'contactus' collection
    const { error: dbError } = await createRecord('contactus', {
      name, email, service_id, message,
    });
    if (dbError) {
      console.error('Failed to save contact form data:', dbError);
    }
    await sendContactEmail({ name, email, service_id, message });

    const successResponse = NextResponse.json({ success: true, message: 'Message sent successfully' });
    successResponse.headers.set('Access-Control-Allow-Origin', '*');
    return successResponse;
  } catch (error: any) {
    console.error('Contact API Error:', error);
    const errorResponse = NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
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