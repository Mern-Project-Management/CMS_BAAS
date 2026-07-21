import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// Define the shape of our settings
export interface GlobalSettings {
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure?: boolean;
  smtp_user?: string;
  smtp_pass?: string;
  admin_email?: string;
  logo_url?: string;
  favicon_url?: string;
  db_uri?: string;
  db_name?: string;
  next_public_api_url?: string;
}

// Helper to update variables in the .env file
function updateEnvVariable(key: string, value: string) {
  const envPath = path.resolve(process.cwd(), '.env');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Matches either "KEY=..." or "KEY = ..."
  const regex = new RegExp(`^${key}\\s*=.*$`, 'm');
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, `${key}=${value}`);
  } else {
    envContent = envContent.trim() + `\n${key}=${value}\n`;
  }

  fs.writeFileSync(envPath, envContent);
}

export async function GET() {
  try {
    await requireRole(['superadmin', 'admin']);
    const db = await getDb();
    
    // Fetch settings from DB
    const settingsDoc = await db.collection('settings').findOne({ type: 'global' });
    let settings: GlobalSettings = settingsDoc?.data || {};

    // Load from process.env with fallbacks
    const dbUri = process.env.MONGODB_URI || '';
    const dbName = process.env.MONGODB_DB || '';
    const smtpUser = process.env.SMTP_USER || settings.smtp_user || '';
    const smtpPass = process.env.SMTP_PASS || settings.smtp_pass || '';
    const nextPublicApiUrl = process.env.NEXT_PUBLIC_API_URL || '';

    // Fallbacks for SMTP settings
    if (!settings.smtp_host) settings.smtp_host = 'smtp.gmail.com';
    if (!settings.smtp_port) settings.smtp_port = 465;
    if (settings.smtp_secure === undefined) settings.smtp_secure = true;
    
    const maskedSettings = {
      ...settings,
      smtp_user: smtpUser,
      smtp_pass: smtpPass ? '********' : '',
      db_uri: dbUri,
      db_name: dbName,
      next_public_api_url: nextPublicApiUrl,
    };

    return NextResponse.json({ success: true, data: maskedSettings });
  } catch (error: any) {
    console.error('Settings GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['superadmin', 'admin']);
    const body = await request.json();
    const { 
      db_uri, 
      db_name, 
      smtp_user, 
      smtp_pass, 
      next_public_api_url, 
      ...smtpSettings 
    } = body;

    const db = await getDb();
    
    // 1. Fetch current settings from DB for SMTP fallback
    const currentSettings = await db.collection('settings').findOne({ type: 'global' });
    const existingData = currentSettings?.data || {};

    let requiresRestart = false;

    // 2. Check and update MONGODB_URI in .env
    if (db_uri && db_uri !== process.env.MONGODB_URI) {
      updateEnvVariable('MONGODB_URI', db_uri);
      requiresRestart = true;
    }

    // 3. Check and update MONGODB_DB in .env
    if (db_name && db_name !== process.env.MONGODB_DB) {
      updateEnvVariable('MONGODB_DB', db_name);
      requiresRestart = true;
    }

    // 4. Check and update SMTP_USER in .env
    if (smtp_user && smtp_user !== process.env.SMTP_USER) {
      updateEnvVariable('SMTP_USER', smtp_user);
      requiresRestart = true;
    }

    // 5. Check and update SMTP_PASS in .env
    if (smtp_pass && smtp_pass !== '********' && smtp_pass !== process.env.SMTP_PASS) {
      updateEnvVariable('SMTP_PASS', smtp_pass);
      requiresRestart = true;
    }

    // 6. Check and update NEXT_PUBLIC_API_URL in .env
    const currentApiUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim();
    if (next_public_api_url && next_public_api_url.trim() !== currentApiUrl) {
      updateEnvVariable('NEXT_PUBLIC_API_URL', next_public_api_url.trim());
      requiresRestart = true;
    }

    // 7. Save remaining SMTP details to DB
    const finalSmtpPass = smtp_pass === '********' 
      ? (existingData.smtp_pass || process.env.SMTP_PASS || '')
      : smtp_pass;

    const newData = {
      ...existingData,
      ...smtpSettings,
      smtp_user: smtp_user || existingData.smtp_user || '',
      smtp_pass: finalSmtpPass,
    };

    await db.collection('settings').updateOne(
      { type: 'global' },
      { $set: { data: newData, updated_at: new Date() } },
      { upsert: true }
    );

    if (requiresRestart) {
      return NextResponse.json({ 
        success: true, 
        message: 'Settings saved. Note: Environment variable (.env) changes require a server restart to take effect.',
        requiresRestart: true
      });
    }

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error: any) {
    console.error('Settings POST Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}
