import crypto from 'crypto'
import * as buffer from 'buffer'

/**
 * Some activities will not have a remote(API) counterparts so they will miss sourceIds.
 * Since we're using sourceIds to find out if an activity already exists in our DB,
 * sourceIds are required when creating an activity.
 * This function generates an md5 hash that can be used as a sourceId of an activity.
 * Prepends string `gen-` to the beginning so generated and remote sourceIds
 * can be distinguished.
 *
 * @param {string} uniqueRemoteId remote member id from an integration. This id needs to be unique in a platform
 * @param {string} type type of the activity
 * @param {string} timestamp unix timestamp of the activity
 * @param {string} platform platform of the activity
 * @returns 32 bit md5 hash generated from the given data, prepended with string `gen-`
 */
export function generateSourceIdHash(
  uniqueRemoteId: string,
  type: string,
  timestamp: string,
  platform: string,
) {
  if (!uniqueRemoteId || !type || !timestamp || !platform) {
    throw new Error('Bad hash input')
  }

  const data = `${uniqueRemoteId}-${type}-${timestamp}-${platform}`
  return `gen-${crypto.createHash('md5').update(data).digest('hex')}`
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
