import AuthService from '../../services/auth/authService'

export default async (req, res) => {
  const payload = await AuthService.changePassword(req.body.oldPassword, req.body.newPassword, req)

  await req.responseHandler.success(req, res, payload)
}
