import Permissions from '../../../security/permissions'
import IntegrationService from '../../../services/integrationService'
import PermissionChecker from '../../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.integrationEdit)

  const { code } = req.query
  const { redirectUrl } = JSON.parse(Buffer.from(req.query.state, 'base64').toString())

  const integration = await new IntegrationService(req).gitlabCallback(code)

  res.redirect(redirectUrl)
}
