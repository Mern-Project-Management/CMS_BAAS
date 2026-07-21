import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { sendTemplateEmail } from '@/lib/mail';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    await requireRole(['superadmin', 'admin']);
    const body = await request.json();
    const { to, templateId, variableData } = body;

    if (!to || !templateId) {
      return NextResponse.json({ success: false, error: 'Missing recipient or template ID' }, { status: 400 });
    }

    if (to.includes(';')) {
      return NextResponse.json({ success: false, error: 'Use commas to separate multiple email addresses.' }, { status: 400 });
    }

    const db = await getDb();
    let objectId;
    try { objectId = new ObjectId(templateId); } catch { return NextResponse.json({ success: false, error: 'Invalid template ID' }, { status: 400 }); }

    const template = await db.collection('email_templates').findOne({ _id: objectId });
    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    // Replace variables in subject and content
    let subject = template.subject;
    let htmlContent = template.html_content;

    if (variableData) {
      Object.keys(variableData).forEach(key => {
        const value = String(variableData[key]);
        // Replace all occurrences of {{key}}
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        subject = subject.replace(regex, value);
        htmlContent = htmlContent.replace(regex, value);
      });
    }

    // Send email
    const emails = to.split(',').map((e: string) => e.trim()).filter((e: string) => e);
    await sendTemplateEmail(emails, subject, htmlContent);

    return NextResponse.json({ success: true, message: 'Email(s) sent successfully' });
  } catch (error: any) {
    console.error('Send Email Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
