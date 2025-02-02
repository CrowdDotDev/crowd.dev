import { getNangoCloudSessionToken, initNangoCloudClient } from '@crowd/nango'

import { NANGO_CONFIG } from '@/conf'
import { safeWrap } from '@/middlewares/errorMiddleware'

export default async (app) => {
  if (NANGO_CONFIG.cloudSecretKey) {
    await initNangoCloudClient(NANGO_CONFIG.cloudSecretKey)
    const allowedIntegrations = NANGO_CONFIG.cloudIntegrations.split(',')
    app.get(
      '/nango/session',
      safeWrap(async (req, res) => {
        const data = await getNangoCloudSessionToken(allowedIntegrations)
        await req.responseHandler.success(req, res, data)
      }),
    )
  }
}
