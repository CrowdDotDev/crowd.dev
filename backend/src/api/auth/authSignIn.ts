import { DEFAULT_TENANT_ID } from '@crowd/common'

import AuthService from '../../services/auth/authService'

export default async (req, res) => {
  const payload = await AuthService.signin(
    req.body.email,
    req.body.password,
    req.body.invitationToken,
    DEFAULT_TENANT_ID,
    req,
  )

  await req.responseHandler.success(req, res, payload)
}
