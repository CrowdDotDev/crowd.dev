import { DataIssueEntity } from '@crowd/types'

import PermissionChecker from '../../services/user/permissionChecker'
import Permissions from '../../security/permissions'
import DataIssueService from '@/services/dataIssueService'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.dataIssueCreate)

  const payload = await new DataIssueService(req).createDataIssue(
    { ...req.body, entity: DataIssueEntity.PERSON },
    req.params.id,
  )

  await req.responseHandler.success(req, res, payload)
}
