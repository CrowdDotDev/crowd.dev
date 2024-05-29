import { Error403 } from '@crowd/common'
import ProductAnalyticsService from '@/services/productAnalyticsService'

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    throw new Error403(req.language)
  }

  await new ProductAnalyticsService(req).createEvent(req.body)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
