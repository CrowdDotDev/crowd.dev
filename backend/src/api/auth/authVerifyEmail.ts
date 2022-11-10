import AuthService from '../../services/auth/authService'

export default async (req, res) => {
  const payload = await AuthService.verifyEmail(req.body.token, req)

  await req.responseHandler.success(req, res, payload)
}
