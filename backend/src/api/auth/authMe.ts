import { Error403 } from '@crowd/common'

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    await req.responseHandler.error(req, res, new Error403(req.language))
    return
  }

  await req.responseHandler.success(req, res, req.currentUser)
}
