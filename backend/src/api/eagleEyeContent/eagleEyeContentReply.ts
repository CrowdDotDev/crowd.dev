import Permissions from '../../security/permissions'
import track from '../../segment/track'
import EagleEyeContentService from '../../services/eagleEyeContentService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.eagleEyeActionCreate)

  const payload = await EagleEyeContentService.reply(req.query.title, req.query.description)

  track(
    'Eagle Eye reply generated',
    {
      title: req.query.title,
      description: req.query.description,
      reply: payload.reply,
    },
    { ...req },
  )
  await req.responseHandler.success(req, res, payload)
}
