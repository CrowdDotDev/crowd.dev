import Error403 from '../../errors/Error403'
import identifyTenant from '../../segment/identifyTenant'
import telemetryTrack from '../../segment/telemetryTrack'
import track from '../../segment/track'
import TenantService from '../../services/tenantService'

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    throw new Error403(req.language)
  }

  const payload = await new TenantService(req).create(req.body)

  track(
    'Tenant Created',
    {
      id: payload.id,
      name: payload.name,
      onboard: !!payload.onboard,
    },
    { ...req },
  )
  identifyTenant({ ...req, currentTenant: payload })

  telemetryTrack('Tenant created', {}, { ...req })

  await req.responseHandler.success(req, res, payload)
}
