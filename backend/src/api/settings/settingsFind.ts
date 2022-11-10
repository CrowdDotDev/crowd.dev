import SettingsService from '../../services/settingsService'

export default async (req, res) => {
  const payload = await SettingsService.findOrCreateDefault(req)

  await req.responseHandler.success(req, res, payload)
}
