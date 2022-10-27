import UserCreator from '../../services/premium/user/userCreator'
import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import track from '../../segment/track'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.userCreate)

    const creator = new UserCreator(req)

    const payload = await creator.execute(req.body)

    track('User Invited', { ...req.body }, { ...req })

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
