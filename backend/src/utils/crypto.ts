import * as crypto from 'crypto';
import * as buffer from 'buffer';

export function generateWebhookSecret(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function verifyWebhookSignature(
  payload: string,
  secret: string,
  signatureHeader: string
): boolean {
  
  console.log("payload", payload)
  const hmac = crypto.createHmac('sha256', secret);
  console.log("hmac", hmac)
  hmac.update(payload);
  console.log("hmac", hmac)
  const expectedSignature = `sha256=${hmac.digest('hex')}`;

  console.log("expectedSignature", expectedSignature)

  return crypto.timingSafeEqual(
    buffer.Buffer.from(signatureHeader),
    buffer.Buffer.from(expectedSignature)
  );
}

