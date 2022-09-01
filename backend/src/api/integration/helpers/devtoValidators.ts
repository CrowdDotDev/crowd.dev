import PermissionChecker from '../../../services/user/permissionChecker'
import Permissions from '../../../security/permissions'
import ApiResponseHandler from '../../apiResponseHandler'
import Error400 from '../../../errors/Error400'
import { getUserByUsername } from '../../../serverless/integrations/usecases/devto/getUser'
import { getOrganization } from '../../../serverless/integrations/usecases/devto/getOrganization'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHasAny([
      Permissions.values.integrationCreate,
      Permissions.values.integrationEdit,
    ])

    if (req.query.username) {
      const result = await getUserByUsername(req.query.username)
      await ApiResponseHandler.success(req, res, result)
    } else if (req.query.organization) {
      const result = await getOrganization(req.query.organization)
      await ApiResponseHandler.success(req, res, result)
    } else {
      // throw bad request since we don't have either of the query params
      await ApiResponseHandler.error(req, res, new Error400(req.language))
    }
  } catch (error) {
    console.error(error)
    await ApiResponseHandler.error(req, res, error)
  }
}
