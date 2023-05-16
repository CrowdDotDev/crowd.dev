import axios from 'axios'
import Error400 from '../../../errors/Error400'
import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'


export default async (req, res) => {
  new PermissionChecker(req).validateHasAny([
    Permissions.values.integrationCreate,
    Permissions.values.integrationEdit,
  ])

  const {apiKey, apiUsername, forumHostname} = req.body

  console.log('apiKey', apiKey)
  console.log('apiUsername', apiUsername)
  console.log('forumHostname', forumHostname)

    if (apiKey && apiUsername && forumHostname) {
      console.log('here inside if')
        try {
            const result = await axios.get(
            `${forumHostname}/admin/users/list/active.json`,
            {
                headers: {
                'Api-Key': apiKey,
                'Api-Username': apiUsername,
                },
            }
            )
            if (
            result.status === 200 &&
            result.data &&
            result.data.length > 0
            ) {
              console.log('here inside if - request success')
            return req.responseHandler.success(req, res, result.data)
            }
        } catch (e) {
            console.log('here inside catch')
            return req.responseHandler.error(req, res, new Error400(req.language))
        }
    }
    console.log('here inside else')
  return req.responseHandler.error(req, res, new Error400(req.language))
}
