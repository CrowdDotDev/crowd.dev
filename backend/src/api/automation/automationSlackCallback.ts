import Axios from 'axios'
import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'
import SettingsService from '../../services/settingsService'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.automationCreate)
  const { redirectUrl } = JSON.parse(Buffer.from(req.query.state, 'base64').toString())

  const { url } = req.account

  console.log('slack automation callback')
  await SettingsService.save({ slackWebHook: url }, req)
  await Axios.post(url, {
    text: 'Crowd.dev Notifier has been successfully connected.',
  })

  res.redirect(redirectUrl)
}
