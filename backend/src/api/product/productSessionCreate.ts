import { Error403 } from '@crowd/common'
import ProductAnalyticsService from '@/services/productAnalyticsService'

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    throw new Error403(req.language)
  }

  // cloudflare headers to get the real ip & country
  // default to localhost if not found (for local development)
  const ipAddress = req.headers['cf-connecting-ip'] || '127.0.0.1'
  const country = req.headers['cf-ipcountry'] || 'US'

  req.body = {
    ...req.body,
    ipAddress,
    country,
  }

  const payload = await new ProductAnalyticsService(req).createSession(req.body)

  await req.responseHandler.success(req, res, payload)
}
