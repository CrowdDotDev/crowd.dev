import AuthService from '../../services/auth/authService'
import TenantService from '@/services/tenantService'

export default async (req, res) => {
  if (!req.body.acceptedTermsAndPrivacy) {
    return res.status(422).send({ error: 'Please accept terms of service and privacy policy' })
  }
  const payload = await AuthService.signup(
    req.body.email,
    req.body.password,
    req.body.invitationToken,
    req.body.tenantId,
    req.body.firstName,
    req.body.lastName,
    req.body.acceptedTermsAndPrivacy,
    req,
  )

  req.currentUser = await AuthService.findByToken(payload, req)
  await new TenantService(req).create({
    name: 'temporaryName',
  })

  return req.responseHandler.success(req, res, payload)
}
