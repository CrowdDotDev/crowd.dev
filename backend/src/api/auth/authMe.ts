import Error403 from '../../errors/Error403'
import { RedisCache } from '../../utils/redis/redisCache'

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    await req.responseHandler.error(req, res, new Error403(req.language))
    return
  }

  const payload = req.currentUser

  const csvExportCountCache = new RedisCache('csvExportCount', req.redis)
  const automationCountCache = new RedisCache('automation', req.redis)

  // TODO: We should probably revisit this later
  payload.tenants = await Promise.all(
    payload.tenants.map(async (tenantUser) => {
      tenantUser.tenant.dataValues = {
        ...tenantUser.tenant.dataValues,
        csvExportCount: Number(await csvExportCountCache.getValue(tenantUser.tenant.id)) || 0,
        automationCount: Number(await automationCountCache.getValue(tenantUser.tenant.id)) || 0,
      }
      return tenantUser
    }),
  )

  await req.responseHandler.success(req, res, payload)
}
