import { Error403 } from '@crowd/common'

import AuthService from '../../services/auth/authService'

export default async (req, res) => {
  if (!req.currentUser) {
    throw new Error403(req.language)
  }

  await AuthService.sendEmailAddressVerificationEmail(
    req.language,
    req.currentUser.email,
    req.body.tenantId,
    req,
  )

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
