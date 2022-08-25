import ApiResponseHandler from '../apiResponseHandler'
import AuthService from '../../services/auth/authService'

export default async (req, res) => {
  try {
    const payload = await AuthService.passwordReset(req.body.token, req.body.password, req)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
