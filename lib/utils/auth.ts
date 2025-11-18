// lib/utils.ts
import crypto from 'crypto'

// Replicate your Node.js password hashing
// First hash with SHA1 (password + salt1), then hash with MD5 (sha1Hash + salt2)
export function hashPassword(password: string): string {
  const salt1 = process.env.SALT1 || process.env.SALTI || "AniMoh";
  const salt2 = process.env.SALT2 || "AniSo";

  if (!salt1 || !salt2) {
    console.error('⚠️ WARNING: Salt values not set in environment variables!')
    console.error('SALT1:', salt1 ? 'SET' : 'NOT SET')
    console.error('SALT2:', salt2 ? 'SET' : 'NOT SET')
  }

  // First hash with SHA1
  const sha1Hash = crypto
    .createHash("sha1")
    .update(password + salt1)
    .digest("hex")

  // Then hash with MD5
  const md5Hash = crypto
    .createHash("md5")
    .update(sha1Hash + salt2)
    .digest("hex")

  return md5Hash
}

// JWT secret
export const JWT_SECRET = process.env.JWT_SECRET 