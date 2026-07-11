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
}

function updateEnvVariable(key: string, value: string) {
  const envPath = path.resolve(process.cwd(), '.env');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
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

    // Fallback to env for SMTP if not in DB
    if (!settings.smtp_user) settings.smtp_user = process.env.SMTP_USER || '';
    if (!settings.smtp_pass) settings.smtp_pass = process.env.SMTP_PASS ? '********' : '';
    if (!settings.smtp_host) settings.smtp_host = 'smtp.gmail.com';
    if (!settings.smtp_port) settings.smtp_port = 465;
    if (settings.smtp_secure === undefined) settings.smtp_secure = true;
    
    // Read env variables
    const dbUri = process.env.MONGODB_URI || '';
    const dbName = process.env.MONGODB_DB || '';
    const nextPublicApiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    // Mask password in response if it exists
    const maskedSettings = {
      ...settings,
      smtp_pass: settings.smtp_pass ? '********' : '',
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
    await requireRole(['superadmin']);
    const body = await request.json();
    const { db_uri, db_name, next_public_api_url, ...smtpSettings } = body;

    const db = await getDb();
    
    // 1. Update settings in database
    const currentSettings = await db.collection('settings').findOne({ type: 'global' });
    const existingData = currentSettings?.data || {};
    
    // If the password is provided as '********', it means the user didn't change it.
    // So we keep the existing password.
    if (smtpSettings.smtp_pass === '********') {
      smtpSettings.smtp_pass = existingData.smtp_pass || process.env.SMTP_PASS;
    }

    const newData = {
      ...existingData,
      ...smtpSettings,
    };

    await db.collection('settings').updateOne(
      { type: 'global' },
      { $set: { data: newData, updated_at: new Date() } },
      { upsert: true }
    );

    // 2. Update env variables if they have changed or are supplied
    let envChanged = false;
    if (db_uri && db_uri !== process.env.MONGODB_URI) {
      updateEnvVariable('MONGODB_URI', db_uri);
      envChanged = true;
    }
    if (db_name && db_name !== process.env.MONGODB_DB) {
      updateEnvVariable('MONGODB_DB', db_name);
      envChanged = true;
    }
    if (smtpSettings.smtp_user && smtpSettings.smtp_user !== process.env.SMTP_USER) {
      updateEnvVariable('SMTP_USER', smtpSettings.smtp_user);
    }
    if (smtpSettings.smtp_pass && smtpSettings.smtp_pass !== existingData.smtp_pass && smtpSettings.smtp_pass !== '********') {
      updateEnvVariable('SMTP_PASS', smtpSettings.smtp_pass);
    }
    if (next_public_api_url && next_public_api_url !== process.env.NEXT_PUBLIC_API_URL) {
      updateEnvVariable('NEXT_PUBLIC_API_URL', next_public_api_url);
    }

    if (envChanged) {
      return NextResponse.json({ 
        success: true, 
        message: 'Settings saved. Note: Database configuration changes require a server restart to take effect.',
        requiresRestart: true
      });
    }

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error: any) {
    console.error('Settings POST Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}
