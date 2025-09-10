import { PlatformType } from '@crowd/types'

import IntegrationRepository from '../../../database/repositories/integrationRepository'
import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.tenantEdit)

  // Git Integration V2 Release Date - integrations updated after this date should be excluded from old git integration
  const gitIntegrationV2ReleaseDate = new Date('2025-09-09T00:00:00.000Z')

  const integrations = await IntegrationRepository.findAllByPlatform(PlatformType.GIT, req)
  // Filter out integrations updated after V2 release date
  const legacyIntegrations = integrations.filter((integration) => {
    const updatedAt = new Date(integration.updatedAt)
    return updatedAt < gitIntegrationV2ReleaseDate
  })

  const payload = legacyIntegrations.reduce((acc, integration) => {
    const {
      id,
      segmentId,
      settings: { remotes },
    } = integration
    acc[segmentId] = { remotes, integrationId: id }
    return acc
  }, {})

  await req.responseHandler.success(req, res, payload)
}
