import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'
import EagleEyeContentService from '../../services/eagleEyeContentService'
import track from '../../segment/track'
import Error404 from '../../errors/Error404'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.eagleEyeContentRead)

  const event = req.body.event
  const params = req.body.params

  switch (event) {
    case 'postClicked':
      console.log('Eagle Eye post clicked', {
        url: params.url,
        platform: params.platform,
      })
      EagleEyeContentService.trackPostClicked(req.body.url, req.body.platform, req)
      break
    case 'generatedReply':
      console.log('Eagle Eye AI reply generated', {
        title: params.title,
        description: params.description,
        platform: params.platform,
        reply: params.reply,
        url: params.url,
      })
      track(
        'Eagle Eye AI reply generated',
        {
          title: params.title,
          description: params.description,
          platform: params.platform,
          reply: params.reply,
          url: params.url,
        },
        { ...req },
      )
      break
    case 'generatedReplyFeedback':
      console.log('Eagle Eye AI reply feedback', {
        type: params.type,
        title: params.title,
        description: params.description,
        platform: params.platform,
        reply: params.reply,
        url: params.url,
      })
      track(
        'Eagle Eye AI reply feedback',
        {
          type: params.type,
          title: params.title,
          description: params.description,
          platform: params.platform,
          reply: params.reply,
          url: params.url,
        },
        { ...req },
      )
      break
    case 'generatedReplyCopied':
      console.log('Eagle Eye AI reply copied', {
        title: params.title,
        description: params.description,
        platform: params.platform,
        url: params.url,
        reply: params.reply,
      })
      track(
        'Eagle Eye AI reply copied',
        {
          title: params.title,
          description: params.description,
          platform: params.platform,
          url: params.url,
          reply: params.reply,
        },
        { ...req },
      )
      break

    default:
      throw new Error404('en', 'erros.eagleEye.invlaidEvent')
  }

  const out = {
    Success: true,
  }

  await req.responseHandler.success(req, res, out)
}
