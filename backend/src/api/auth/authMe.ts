import { Error403 } from '@crowd/common'

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    await req.responseHandler.error(req, res, new Error403(req.language))
    return
  }

  const payload = req.currentUser

  payload.tenants = await Promise.all(
    payload.tenants.map(async (tenantUser) => tenantUser),
  )

  await req.responseHandler.success(req, res, payload)
}
