import AuthService from '../../services/auth/authService'

export default async (req, res) => {
  await AuthService.sendPasswordResetEmail(req.language, req.body.email, req.body.tenantId, req)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
