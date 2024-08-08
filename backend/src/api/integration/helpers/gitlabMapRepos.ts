import PermissionChecker from '../../../services/user/permissionChecker'
import IntegrationService from '../../../services/integrationService'

export default async (req, res, next) => {
  try {
    new PermissionChecker(req).validateHas('integrationEdit')

    const service = new IntegrationService(req)

    const { id } = req.params
    const { mapping } = req.body

    await service.mapGitlabRepos(id, mapping)

    const payload = true

    res.status(200).send(payload)
  } catch (error) {
    next(error)
  }
}