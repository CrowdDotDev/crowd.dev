import { Error403 } from '@crowd/common'

import AutomationRepository from '@/database/repositories/automationRepository'

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    await req.responseHandler.error(req, res, new Error403(req.language))
    return
  }

  const payload = req.currentUser

  payload.tenants = await Promise.all(
    payload.tenants.map(async (tenantUser) => {
      tenantUser.tenant.dataValues = {
        ...tenantUser.tenant.dataValues,
        automationCount:
          Number(await AutomationRepository.countAllActive(req.database, tenantUser.tenant.id)) ||
          0,
      }
      return tenantUser
    }),
  )

  await req.responseHandler.success(req, res, payload)
}
