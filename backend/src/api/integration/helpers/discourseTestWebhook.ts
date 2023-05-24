import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'
import IncomingWebhookRepository from '../../../database/repositories/incomingWebhookRepository'
import SequelizeRepository from '../../../database/repositories/sequelizeRepository'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.tenantEdit)

  const options = await SequelizeRepository.getDefaultIRepositoryOptions()
  const repo = new IncomingWebhookRepository(options)

  const isWebhooksReceived = await repo.checkWebhooksExistForIntegration(req.body.integrationId)

  await req.responseHandler.success(req, res, { isWebhooksReceived })
}
