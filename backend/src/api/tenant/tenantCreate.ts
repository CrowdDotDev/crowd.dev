import ApiResponseHandler from '../apiResponseHandler'
import Error403 from '../../errors/Error403'
import TenantService from '../../services/tenantService'
import track from '../../segment/track'
import telemetryTrack from '../../segment/telemetryTrack'
import identifyTenant from '../../segment/identifyTenant'

export default async (req, res) => {
  try {
    if (!req.currentUser || !req.currentUser.id) {
      throw new Error403(req.language)
    }

    const payload = await new TenantService(req).create(req.body)

    track(
      'Tenant Created',
      {
        id: payload.id,
        name: payload.name,
      },
      { ...req },
    )
    identifyTenant(req.currentUser, payload)

    telemetryTrack('Tenant created', {}, { ...req })

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
