import * as crypto from 'crypto'
import * as buffer from 'buffer'

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
