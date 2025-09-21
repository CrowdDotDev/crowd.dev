import AuthService from '../../services/auth/authService'

export default async (req, res) => {
  if (!req.body.acceptedTermsAndPrivacy) {
    return res.status(422).send({ error: 'Please accept terms of service and privacy policy' })
  }
  
  try {
    const { invitationToken } = req.params
    const payload = await AuthService.signupViaInvitationLink(
      req.body.email,
      req.body.password,
      invitationToken,
      req.body.firstName,
      req.body.lastName,
      req.body.acceptedTermsAndPrivacy,
      req,
    )

    return req.responseHandler.success(req, res, payload)
  } catch (error) {
    return req.responseHandler.error(req, res, error)
  }
}