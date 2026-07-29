import nodemailer from 'nodemailer';
import { getDb } from '@/lib/db';
import { GlobalSettings } from '@/app/api/settings/route';

export async function getTransporter() {
  let settings: GlobalSettings = {};
  try {
    const db = await getDb();
    const settingsDoc = await db.collection('settings').findOne({ type: 'global' });
    if (settingsDoc) settings = settingsDoc.data;
  } catch (error) {
    console.error('Failed to fetch SMTP settings from DB:', error);
  }

  const user = settings.smtp_user || process.env.SMTP_USER;
  const pass = settings.smtp_pass || process.env.SMTP_PASS;
  const host = settings.smtp_host || 'smtp.gmail.com';
  const port = settings.smtp_port || 465;
  const secure = settings.smtp_secure ?? true;

  if (!user || !pass) {
    console.error('❌ EMAIL ERROR: SMTP credentials missing');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return { transporter, user };
}

export const sendContactEmail = async (data: { name: string; email: string; service_id: string; message: string; url?: string }) => {
  const { name, email, service_id, message, url } = data;
  const { transporter, user } = await getTransporter();

  const defaultAdminHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 0; color: #3f3f46; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e4e4e7; }
    .header { background-color: #0c1e21; padding: 30px; text-align: center; border-bottom: 4px solid #187272; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
    .content { padding: 40px 30px; }
    .intro { margin-top: 0; font-size: 16px; color: #52525b; line-height: 1.5; }
    .data-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .data-table th, .data-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e4e4e7; font-size: 14px; }
    .data-table th { width: 35%; color: #71717a; font-weight: 500; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
    .data-table td { color: #18181b; font-weight: 500; }
    .message-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #187272; border-radius: 6px; padding: 20px; margin-top: 25px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; }
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
        <tr><th>Client Name</th><td>{{name}}</td></tr>
        <tr><th>Email Address</th><td><a href="mailto:{{email}}" style="color: #187272; text-decoration: none;">{{email}}</a></td></tr>
        <tr><th>Service / Product</th><td>{{service_id}}</td></tr>
        <tr><th>Source URL</th><td><a href="{{url}}" style="color: #187272; text-decoration: none;">{{url}}</a></td></tr>
      </table>
      <div style="margin-top: 30px; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Message Content</div>
      <div class="message-box">{{message}}</div>
    </div>
    <div class="footer">
      This is an automated notification from your website's CMS system.
    </div>
  </div>
</body>
</html>`;

  const defaultClientHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fafafa; margin: 0; padding: 40px 0; color: #27272a; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #f4f4f5; }
    .hero { background: #0c1e21; padding: 40px 30px; text-align: center; border-bottom: 4px solid #187272; }
    .hero h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 500; letter-spacing: 1px; }
    .content { padding: 40px; line-height: 1.6; font-size: 15px; color: #3f3f46; }
    .content p { margin: 0 0 20px 0; }
    .details-box { background: #f4f4f5; border-radius: 6px; padding: 25px; margin: 30px 0; border-left: 4px solid #187272; }
    .details-box p { margin: 0 0 10px 0; font-size: 14px; }
    .details-box p:last-child { margin: 0; }
    .details-label { font-weight: 600; color: #18181b; display: inline-block; width: 120px; }
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
      <p>If you have any additional information to share or immediate questions, please feel free to reply directly to this email.</p>
      <p style="margin-top: 30px; margin-bottom: 0;">Best Regards,<br><strong style="color: #18181b;">The CROWN Packaging Team</strong></p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} CROWN Packaging. All rights reserved.<br>
      This is an automated confirmation email.
    </div>
  </div>
</body>
</html>`;

  try {
    const db = await getDb();

    // Fetch Admin Notification Template
    const adminTemplate = await db.collection('email_templates').findOne({ name: "Admin Inquiry Notification" });
    let adminSubject = adminTemplate?.subject || "New Inquiry: {{service_id}} from {{name}}";
    let adminHtml = adminTemplate?.html_content || defaultAdminHtml;

    const vars = { name, email, service_id: service_id || 'General', message, url: url || '' };
    Object.entries(vars).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      adminSubject = adminSubject.replace(regex, value);
      adminHtml = adminHtml.replace(regex, value);
    });

    await transporter.sendMail({
      from: ` <${user}>`,
      to: user,
      subject: adminSubject,
      html: adminHtml,
    });

    // Fetch Client Auto-Reply Template
    const clientTemplate = await db.collection('email_templates').findOne({ name: "Client Inquiry Auto-Reply" });
    let clientSubject = clientTemplate?.subject || "Thank You for Your Inquiry - CROWN Packaging";
    let clientHtml = clientTemplate?.html_content || defaultClientHtml;

    Object.entries(vars).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      clientSubject = clientSubject.replace(regex, value);
      clientHtml = clientHtml.replace(regex, value);
    });

    await transporter.sendMail({
      from: ` <${user}>`,
      to: email,
      subject: clientSubject,
      replyTo: user,
      html: clientHtml,
    });
  } catch (error) {
    console.error('Error sending contact email with templates:', error);
  }
};

export const sendTemplateEmail = async (to: string | string[], subject: string, htmlContent: string) => {
  const { transporter, user } = await getTransporter();

  await transporter.sendMail({
    from: ` <${user}>`,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html: htmlContent,
  });
};