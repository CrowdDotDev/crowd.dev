import AuthService from '../../services/auth/authService'

export default async (req, res) => {
  const payload = await AuthService.signup(
    req.body.email,
    req.body.password,
    req.body.invitationToken,
    req.body.tenantId,
    req.body.firstName,
    req.body.lastName,
    req,
  )

  await req.responseHandler.success(req, res, payload)
}
