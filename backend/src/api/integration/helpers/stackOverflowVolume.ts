import axios from 'axios'
import Error400 from '../../../errors/Error400'
import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHasAny([
    Permissions.values.integrationCreate,
    Permissions.values.integrationEdit,
  ])

  if (req.query.tags) {
    try {
      const result = await axios.get(
        `https://api.stackexchange.com/2.3/questions`,
        {
            params: {
                site: 'stackoverflow',
                tagged: req.query.tags,
                filter: 'total'
            }
        }
      )
      const data = result.data
      console.log(data)
      if (
        result.status === 200 &&
        data.total >= 0
      ) {
        console.log('here')
        return req.responseHandler.success(req, res, data)
      }
    } catch (e) {
      return req.responseHandler.error(req, res, new Error400(req.language))
    }
  }
  return req.responseHandler.error(req, res, new Error400(req.language))
}
