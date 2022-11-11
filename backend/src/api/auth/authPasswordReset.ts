import AuthService from '../../services/auth/authService'

export default async (req, res) => {
  const payload = await AuthService.passwordReset(req.body.token, req.body.password, req)

  await req.responseHandler.success(req, res, payload)
}
