import crypto from 'crypto';
import { config } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const KEY_HEX = config.ENCRYPTION_KEY;
if (!KEY_HEX || KEY_HEX.length !== 64) {
  throw new Error(
    'ENCRYPTION_KEY must be set as a 32-byte hex string (64 hex chars) in environment'
  );
}
const KEY = Buffer.from(KEY_HEX, 'hex');

/**
 * Encrypt sensitive data (e.g., National ID)
 * Format returned: iv:authTag:ciphertext (all hex)
 */
export function encrypt(text: string): string {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(16); // 128-bit IV
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (error: any) {
    throw new Error('Encryption failed: ' + (error?.message ?? error));
  }
}

/**
 * Decrypt sensitive data
 * Expects format: iv:authTag:ciphertext (all hex)
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return encryptedData;
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error: any) {
    throw new Error('Decryption failed: ' + (error?.message ?? error));
  }
}

/**
 * Hash data (one-way, for integrity / non-reversible use)
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

export default {
  encrypt,
  decrypt,
  hash
};