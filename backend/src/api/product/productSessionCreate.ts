import { Error403 } from '@crowd/common'
import ProductAnalyticsService from '@/services/productAnalyticsService'
// import { lookup } from 'fast-geoip'

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    throw new Error403(req.language)
  }

  // req.log.info('ProductSessionCreate', req.ip)
  // req.log.info('location', await lookup('10.90.0.1'))

  // const ip = req.headers['x-forwarded-for']
  // req.log.info('ip', ip)

  const payload = await new ProductAnalyticsService(req).createSession(req.body)


  await req.responseHandler.success(req, res, payload)
}
