import ApiResponseHandler from '../apiResponseHandler'
import AuthService from '../../services/auth/authService'

export default async (req, res) => {
  try {
    await AuthService.sendPasswordResetEmail(req.language, req.body.email, req.body.tenantId, req)

    const payload = true

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
