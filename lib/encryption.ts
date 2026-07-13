import crypto from 'crypto';

// Use a static 32-byte key for encryption
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'd6F3E0a5f1C2b8A3d9E4f5C6a7B8d9E0';
const IV_LENGTH = 16;

export function encryptValue(value: any): string {
  if (value === null || value === undefined || value === '') return '';
  const text = String(value);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptValue(value: any): string {
  if (typeof value !== 'string' || !value.includes(':')) return String(value);
  try {
    const parts = value.split(':');
    if (parts.length < 2) return String(value);
    const iv = Buffer.from(parts.shift() || '', 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    return '[ENCRYPTED]';
  }
}
