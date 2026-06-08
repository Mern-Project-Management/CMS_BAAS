// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-var-requires
import nodemailer from 'nodemailer';

const SMTP_USER = process.env.SMTP_USER || "harshit.dhodi2108@gmail.com";
const SMTP_PASS = process.env.SMTP_PASS || "jnkb ytek ilqm ryfm";

// Debug logging (Server-side console)
if (!SMTP_USER || !SMTP_PASS) {
  console.error('❌ EMAIL ERROR: SMTP_USER or SMTP_PASS is missing in .env.local');
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export const sendContactEmail = async (data: { name: string; email: string; service_id: string; message: string }) => {
  const { name, email, service_id, message } = data;
  const gold = '#D4AF37';
  const goldDark = '#B5922E';
  const goldLight = '#E6C45A';

  // Admin/owner email template (dark theme with gold)
  const adminHtmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; line-height: 1.6; margin: 0; padding: 0; background-color: #0a0a0a; }
        .container { max-width: 600px; margin: 40px auto; background: #111; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5); border: 1px solid ${gold}20; }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border-bottom: 2px solid ${gold}40; padding: 40px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; color: ${gold}; text-transform: uppercase; letter-spacing: 3px; font-family: 'Playfair Display', serif; }
        .icon { font-size: 48px; margin-bottom: 10px; color: ${gold}; }
        .content { padding: 40px; }
        .field-group { margin-bottom: 24px; }
        .label { display: block; font-size: 11px; font-weight: 700; color: ${gold}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
        .value { font-size: 15px; color: #e2e8f0; padding: 14px 18px; background: linear-gradient(90deg, #1a1a1a 0%, #0f0f0f 100%); border-radius: 8px; border-left: 4px solid ${gold}; }
        .message-content { font-size: 14px; color: #cbd5e1; line-height: 1.8; padding: 24px; background: #0a0a0a; border-radius: 8px; border: 1px solid ${gold}20; white-space: pre-wrap; }
        .footer { background: linear-gradient(135deg, #0a0a0a 0%, #050505 100%); border-top: 1px solid ${gold}20; padding: 28px; text-align: center; font-size: 12px; color: ${gold}80; }
        .separator { height: 1px; background: linear-gradient(90deg, ${gold}00, ${gold}40, ${gold}00); margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">✉️</div>
          <h1>New Inquiry Received</h1>
        </div>
        <div class="content">
          <div class="field-group">
            <span class="label">Client Name</span>
            <div class="value">${name}</div>
          </div>
          <div class="field-group">
            <span class="label">Email Address</span>
            <div class="value">${email}</div>
          </div>
          <div class="field-group">
            <span class="label">Service Interest</span>
            <div class="value">${service_id}</div>
          </div>
          <div class="separator"></div>
          <div class="field-group">
            <span class="label">Message Details</span>
            <div class="message-content">${message}</div>
          </div>
        </div>
        <div class="footer">
          This is an automated notification from your website's contact form.<br>
          &copy; ${new Date().getFullYear()} Brand Untold. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  // Client confirmation email template (dark theme with gold)
  const clientHtmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; line-height: 1.6; margin: 0; padding: 0; background-color: #0a0a0a; }
        .container { max-width: 600px; margin: 40px auto; background: #111; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5); border: 1px solid ${gold}20; }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border-bottom: 2px solid ${gold}40; padding: 40px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; color: ${gold}; text-transform: uppercase; letter-spacing: 2px; font-family: 'Playfair Display', serif; }
        .icon { font-size: 60px; margin-bottom: 15px; color: ${gold}; }
        .content { padding: 40px; }
        .intro { font-size: 16px; color: #cbd5e1; line-height: 1.8; margin-bottom: 30px; text-align: center; }
        .details { background: linear-gradient(90deg, #1a1a1a 0%, #0f0f0f 100%); border-radius: 10px; padding: 24px; border: 1px solid ${gold}20; margin-bottom: 30px; }
        .detail-item { margin-bottom: 16px; }
        .detail-label { color: ${gold}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .detail-value { color: #e2e8f0; font-size: 15px; }
        .cta { text-align: center; margin-top: 30px; padding: 20px; background: #0a0a0a; border-radius: 10px; border: 1px solid ${gold}20; }
        .cta-text { color: #94a3b8; font-size: 14px; margin-bottom: 16px; }
        .cta-button { display: inline-block; padding: 14px 36px; background: ${gold}; color: #0a0a0a; text-decoration: none; font-weight: 700; border-radius: 6px; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; }
        .footer { background: linear-gradient(135deg, #0a0a0a 0%, #050505 100%); border-top: 1px solid ${gold}20; padding: 28px; text-align: center; font-size: 12px; color: ${gold}80; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">✨</div>
          <h1>Inquiry Received</h1>
        </div>
        <div class="content">
          <p class="intro">Thank you for reaching out, <strong>${name}</strong>! Your inquiry has been successfully received. We'll get back to you shortly.</p>
          
          <div class="details">
            <div class="detail-item">
              <div class="detail-label">Your Inquiry</div>
              <div class="detail-value">${service_id}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Your Email</div>
              <div class="detail-value">${email}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">We'll be in touch soon</div>
              <div class="detail-value">Our team will review your request and respond within 24 hours</div>
            </div>
          </div>

          <div class="cta">
            <p class="cta-text">Have more questions?</p>
            <a href="mailto:${SMTP_USER}" class="cta-button" style="background: ${gold}; color: #0a0a0a;">Reply to this email</a>
          </div>
        </div>
        <div class="footer">
          This is an automated confirmation from Brand Untold.<br>
          &copy; ${new Date().getFullYear()} Brand Untold. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  // Send email to admin/owner
  await transporter.sendMail({
    from: `"Brand Untold" <${SMTP_USER}>`,
    to: SMTP_USER,
    subject: `New Inquiry: ${service_id} from ${name}`,
    html: adminHtmlContent,
  });

  // Send confirmation email to client
  await transporter.sendMail({
    from: `"Brand Untold" <${SMTP_USER}>`,
    to: email,
    subject: `Thank you for your inquiry - ${service_id}`,
    replyTo: SMTP_USER,
    html: clientHtmlContent,
  });
};