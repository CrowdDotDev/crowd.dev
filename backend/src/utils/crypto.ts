import * as crypto from 'crypto'
import * as buffer from 'buffer'
import { ENCRYPTION_CONFIG } from '../conf'

export function generateWebhookSecret(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

export function verifyWebhookSignature(
  payload: string,
  secret: string,
  signatureHeader: string,
): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expectedSignature = `sha256=${hmac.digest('hex')}`

  return crypto.timingSafeEqual(
    buffer.Buffer.from(signatureHeader),
    buffer.Buffer.from(expectedSignature),
  )
}

export function encryptData(password: string): string {
  const algo = 'aes-256-cbc'
  const secretKey = ENCRYPTION_CONFIG.secretKey
  const inVec = ENCRYPTION_CONFIG.initVector
  const cipherText = crypto.createCipheriv(algo, secretKey, inVec)

  let encryptedData = cipherText.update(password, 'utf-8', 'hex')
  encryptedData += cipherText.final('hex')

  return encryptedData
}

export function decryptData(password: string): string {
  const algo = 'aes-256-cbc'
  const secretKey = ENCRYPTION_CONFIG.secretKey
  const inVec = ENCRYPTION_CONFIG.initVector
  const decipherText = crypto.createDecipheriv(algo, secretKey, inVec)

  let decryptedData = decipherText.update(password, 'hex', 'utf-8')
  decryptedData += decipherText.final('utf8')

  return decryptedData
}
