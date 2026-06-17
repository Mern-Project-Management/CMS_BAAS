import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';

export interface EmailTemplate {
  _id?: ObjectId | string;
  id?: string;
  name: string;
  subject: string;
  html_content: string;
  variables: string[];
  is_default?: boolean;
}

const defaultTemplates: Omit<EmailTemplate, '_id' | 'id'>[] = [
  {
    name: "Admin Inquiry Notification",
    subject: "New Inquiry: {{service_id}} from {{name}}",
    variables: ["name", "email", "service_id", "message", "url"],
    is_default: true,
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 0; color: #3f3f46; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e4e4e7; }
    .header { background-color: #18181b; padding: 30px; text-align: center; border-bottom: 3px solid #D4AF37; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
    .content { padding: 40px 30px; }
    .intro { margin-top: 0; font-size: 16px; color: #52525b; line-height: 1.5; }
    .data-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .data-table th, .data-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e4e4e7; font-size: 14px; }
    .data-table th { width: 35%; color: #71717a; font-weight: 500; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
    .data-table td { color: #18181b; font-weight: 500; }
    .message-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin-top: 25px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #a1a1aa; background-color: #fafafa; border-top: 1px solid #f4f4f5; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>New Lead Captured</h1>
    </div>
    <div class="content">
      <p class="intro">A new inquiry has been submitted through the website contact form. Below are the details:</p>
      
      <table class="data-table">
        <tr>
          <th>Client Name</th>
          <td>{{name}}</td>
        </tr>
        <tr>
          <th>Email Address</th>
          <td><a href="mailto:{{email}}" style="color: #0284c7; text-decoration: none;">{{email}}</a></td>
        </tr>
        <tr>
          <th>Service of Interest</th>
          <td>{{service_id}}</td>
        </tr>
        <tr>
          <th>Source URL</th>
          <td><a href="{{url}}" style="color: #0284c7; text-decoration: none;">{{url}}</a></td>
        </tr>
      </table>

      <div style="margin-top: 30px; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Message Content</div>
      <div class="message-box">{{message}}</div>
    </div>
    <div class="footer">
      This is an automated notification from your website's CMS system. Please do not reply directly to this email.
    </div>
  </div>
</body>
</html>`
  },
  {
    name: "Client Inquiry Auto-Reply",
    subject: "Thank You for Your Inquiry - Brand Untold",
    variables: ["name", "email", "service_id"],
    is_default: true,
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fafafa; margin: 0; padding: 40px 0; color: #27272a; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #f4f4f5; }
    .hero { background: #18181b; padding: 40px 30px; text-align: center; border-bottom: 4px solid #D4AF37; }
    .hero h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 400; letter-spacing: 1px; }
    .content { padding: 40px; line-height: 1.6; font-size: 15px; color: #3f3f46; }
    .content p { margin: 0 0 20px 0; }
    .details-box { background: #f4f4f5; border-radius: 6px; padding: 25px; margin: 30px 0; border-left: 3px solid #D4AF37; }
    .details-box p { margin: 0 0 10px 0; font-size: 14px; }
    .details-box p:last-child { margin: 0; }
    .details-label { font-weight: 600; color: #18181b; display: inline-block; width: 120px; }
    .cta-container { text-align: center; margin: 40px 0 20px 0; }
    .btn { display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 4px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px; }
    .footer { text-align: center; padding: 30px; font-size: 12px; color: #a1a1aa; border-top: 1px solid #f4f4f5; background: #fafafa; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="hero">
      <h1>Inquiry Received</h1>
    </div>
    <div class="content">
      <p>Dear <strong>{{name}}</strong>,</p>
      <p>Thank you for reaching out to us. We have successfully received your inquiry and our team is currently reviewing your request.</p>
      
      <div class="details-box">
        <p><span class="details-label">Reference:</span> {{service_id}}</p>
        <p><span class="details-label">Email:</span> {{email}}</p>
        <p><span class="details-label">Response Time:</span> Within 24-48 Business Hours</p>
      </div>

      <p>If you have any additional information to share or immediate questions, please feel free to reply directly to this email. We value your interest and look forward to assisting you.</p>
      
      <p style="margin-top: 30px; margin-bottom: 0;">Best Regards,<br><strong style="color: #18181b;">The Brand Untold Team</strong></p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Brand Untold. All rights reserved.<br>
      This is an automated confirmation email.
    </div>
  </div>
</body>
</html>`
  },
  {
    name: "Welcome Email",
    subject: "Welcome to Our Platform!",
    variables: ["name", "login_url"],
    is_default: true,
    html_content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f9f9f9; }
    .container { max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    h1 { color: #111; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    .btn { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 4px; margin-top: 20px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome Aboard, {{name}}!</h1>
    <p>We are absolutely thrilled to welcome you to our platform. Your account has been successfully created and you're now ready to explore all the features we have to offer.</p>
    <p>To get started, simply log in to your dashboard and complete your profile setup.</p>
    <a href="{{login_url}}" class="btn" style="color: #fff;">Access Your Account</a>
    <p style="margin-top: 30px; font-size: 14px; color: #666;">If you have any questions or need assistance, our support team is always here to help.</p>
  </div>
</body>
</html>`
  },
  {
    name: "Password Reset",
    subject: "Reset Your Password Request",
    variables: ["reset_link", "name"],
    is_default: true,
    html_content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f9f9f9; }
    .container { max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    h2 { color: #111; }
    .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 4px; margin-top: 20px; font-weight: bold; }
    .warning { font-size: 12px; color: #888; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Password Reset Request</h2>
    <p>Hello <strong>{{name}}</strong>,</p>
    <p>We received a request to reset the password associated with your account. You can reset your password by clicking the secure link below:</p>
    <a href="{{reset_link}}" class="btn" style="color: #fff;">Reset My Password</a>
    <p class="warning">If you did not request a password reset, please disregard this email. Your password will remain unchanged and your account is secure.</p>
  </div>
</body>
</html>`
  },
  {
    name: "General Notification",
    subject: "Notification: {{title}}",
    variables: ["title", "message"],
    is_default: true,
    html_content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f9f9f9; }
    .container { max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 4px solid #111; }
    h2 { margin-top: 0; color: #111; }
    .content { padding: 15px; background: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0; margin-top: 20px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="container">
    <h2>{{title}}</h2>
    <div class="content">{{message}}</div>
  </div>
</body>
</html>`
  }
];

export async function GET() {
  try {
    await requireRole(['superadmin', 'admin']);
    const db = await getDb();
    
    // Check if templates exist, if not, seed defaults
    const count = await db.collection('email_templates').countDocuments();
    if (count === 0) {
      await db.collection('email_templates').insertMany(defaultTemplates.map(t => ({ ...t, created_at: new Date() })));
    }

    const templates = await db.collection('email_templates').find().sort({ created_at: -1 }).toArray();
    
    const data = templates.map(t => ({
      ...t,
      id: t._id.toString(),
      _id: undefined
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Email templates GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['superadmin', 'admin']);
    const body = await request.json();
    
    if (!body.name || !body.subject || !body.html_content) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection('email_templates').insertOne({
      name: body.name,
      subject: body.subject,
      html_content: body.html_content,
      variables: body.variables || [],
      is_default: false,
      created_at: new Date()
    });

    const newTemplate = await db.collection('email_templates').findOne({ _id: result.insertedId });
    const data = newTemplate ? { ...newTemplate, id: newTemplate._id.toString(), _id: undefined } : null;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to create template' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole(['superadmin', 'admin']);
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) return NextResponse.json({ success: false, error: 'Missing template ID' }, { status: 400 });

    const db = await getDb();
    let objectId;
    try { objectId = new ObjectId(id); } catch { return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 }); }

    // Remove immutable fields from update
    delete updateData._id;
    delete updateData.is_default;
    delete updateData.created_at;

    await db.collection('email_templates').updateOne(
      { _id: objectId },
      { $set: { ...updateData, updated_at: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole(['superadmin', 'admin']);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ success: false, error: 'Missing template ID' }, { status: 400 });

    const db = await getDb();
    let objectId;
    try { objectId = new ObjectId(id); } catch { return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 }); }

    const template = await db.collection('email_templates').findOne({ _id: objectId });
    if (template?.is_default) {
      return NextResponse.json({ success: false, error: 'Cannot delete default templates' }, { status: 400 });
    }

    await db.collection('email_templates').deleteOne({ _id: objectId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to delete template' }, { status: 500 });
  }
}
