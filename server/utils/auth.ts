import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

/**
 * Secure password hashing using Node.js built-in scrypt with unique random 16-byte salt.
 * Formatted as `${salt}:${derivedKeyHex}`.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

/**
 * Constant-time password verification preventing timing attacks.
 */
export async function verifyPassword(password: string, combinedHash: string): Promise<boolean> {
  if (!combinedHash || !combinedHash.includes(':')) {
    return false
  }

  const [salt, storedKeyHex] = combinedHash.split(':')
  if (!salt || !storedKeyHex) {
    return false
  }

  try {
    const keyBuffer = Buffer.from(storedKeyHex, 'hex')
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer

    if (keyBuffer.length !== derivedKey.length) {
      return false
    }

    return timingSafeEqual(keyBuffer, derivedKey)
  } catch {
    return false
  }
}
