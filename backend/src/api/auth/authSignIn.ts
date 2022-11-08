import AuthService from '../../services/auth/authService'

export default async (req, res) => {
  const payload = await AuthService.signin(
    req.body.email,
    req.body.password,
    req.body.invitationToken,
    req.body.tenantId,
    req,
  )

  await req.responseHandler.success(req, res, payload)
}
