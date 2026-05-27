import { NextRequest, NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/mail';
import { createRecord } from '@/lib/db'; // Import createRecord

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid request format' }, { status: 400 });
    }

    const { name, email, service_id, message } = body;

    if (!name || !email || !service_id || !message) {
      console.warn('⚠️ Contact form validation failed. Missing fields:', { name: !!name, email: !!email, service: !!service_id, msg: !!message });
      return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
    }

    // Save contact form data to the 'contactus' collection
    const { data: newRecord, error: dbError } = await createRecord('contactus', {
      name, email, service_id, message,
    });
    if (dbError) {
      console.error('Failed to save contact form data:', dbError);
    }
    await sendContactEmail({ name, email, service_id, message });

    return NextResponse.json({ success: true, message: 'Message sent successfully' });
  } catch (error: any) {
    console.error('Contact API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}