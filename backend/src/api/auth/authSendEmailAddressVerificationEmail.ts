import ApiResponseHandler from '../apiResponseHandler'
import Error403 from '../../errors/Error403'

import AuthService from '../../services/auth/authService'

export default async (req, res) => {
  try {
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

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
