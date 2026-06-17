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

  try {
    const db = await getDb();

    // Fetch Admin Notification Template
    const adminTemplate = await db.collection('email_templates').findOne({ name: "Admin Inquiry Notification" });
    if (adminTemplate) {
      let subject = adminTemplate.subject;
      let html = adminTemplate.html_content;

      const vars = { name, email, service_id, message, url: url || '' };
      Object.entries(vars).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        subject = subject.replace(regex, value);
        html = html.replace(regex, value);
      });

      await transporter.sendMail({
        from: ` <${user}>`,
        to: user,
        subject,
        html,
      });
    }

    // Fetch Client Auto-Reply Template
    const clientTemplate = await db.collection('email_templates').findOne({ name: "Client Inquiry Auto-Reply" });
    if (clientTemplate) {
      let subject = clientTemplate.subject;
      let html = clientTemplate.html_content;

      const vars = { name, email, service_id, message, url: url || '' };
      Object.entries(vars).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        subject = subject.replace(regex, value);
        html = html.replace(regex, value);
      });

      await transporter.sendMail({
        from: ` <${user}>`,
        to: email,
        subject,
        replyTo: user,
        html,
      });
    }
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