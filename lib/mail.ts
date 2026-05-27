// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-var-requires
import nodemailer from 'nodemailer';

const SMTP_USER = process.env.SMTP_USER || "branduntold@gmail.com";
const SMTP_PASS = process.env.SMTP_PASS || "bapb spqs njpy vikx";

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

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2d3436; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
        .header { background-color: #0f172a; color: #ffffff; padding: 40px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 600; text-transform: uppercase; letter-spacing: 2.5px; }
        .content { padding: 40px; }
        .field-group { margin-bottom: 24px; }
        .label { display: block; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 6px; }
        .value { font-size: 15px; color: #1e293b; padding: 12px 16px; background-color: #f1f5f9; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .message-content { font-size: 15px; color: #334155; line-height: 1.7; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9; white-space: pre-wrap; }
        .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Inquiry Received</h1>
        </div>
        <div class="content">
          <div class="field-group">
            <span class="label">Full Name</span>
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
          <div class="field-group">
            <span class="label">Message Details</span>
            <div class="message-content">${message}</div>
          </div>
        </div>
        <div class="footer">
          This is an automated notification from your website's contact form.<br>
          &copy; ${new Date().getFullYear()} Brand Untold.
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Brand Untold Support" <${process.env.SMTP_USER}>`,
    to: email,
    replyTo: email,
    subject: `New Inquiry: ${service_id} from ${name}`,
    html: htmlContent,
  });
};