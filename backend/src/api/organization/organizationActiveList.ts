import { Error400 } from '@crowd/common'

import { IActiveOrganizationFilter } from '../../database/repositories/types/organizationTypes'
import Permissions from '../../security/permissions'
import OrganizationService from '../../services/organizationService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberRead)

  let offset = 0
  if (req.query.offset) {
    offset = parseInt(req.query.offset, 10)
  }
  let limit = 20
  if (req.query.limit) {
    limit = parseInt(req.query.limit, 10)
  }

  if (req.query.filter?.activityTimestampFrom === undefined) {
    throw new Error400(req.language, 'errors.members.activeList.activityTimestampFrom')
  }

  if (req.query.filter?.activityTimestampTo === undefined) {
    throw new Error400(req.language, 'errors.members.activeList.activityTimestampTo')
  }

  const filters: IActiveOrganizationFilter = {
    platforms:
      req.query.filter?.platforms !== undefined
        ? req.query.filter?.platforms.split(',')
        : undefined,
    isTeamOrganization:
      req.query.filter?.isTeamOrganization === undefined
        ? undefined
        : req.query.filter?.isTeamOrganization === 'true',
    activityTimestampFrom: req.query.filter?.activityTimestampFrom,
    activityTimestampTo: req.query.filter?.activityTimestampTo,
  }

  const orderBy = req.query.orderBy || 'activityCount_DESC'

  const payload = await new OrganizationService(req).findAndCountActive(
    filters,
    offset,
    limit,
    orderBy,
    req.query.segments,
  )

  await req.responseHandler.success(req, res, payload)
}
