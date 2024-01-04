import { Error403 } from '@crowd/common'
import telemetryTrack from '../../segment/telemetryTrack'
import track from '../../segment/track'
import TenantService from '../../services/tenantService'

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    throw new Error403(req.language)
  }

  const payload = await new TenantService(req).confirmPayment(req.params.tenantId, req.body)

  track(
    'Tenant Payment',
    {
      id: payload.id,
      plan: payload.plan,
    },
    { ...req },
  )

  telemetryTrack('Tenant payment', {}, { ...req })

  await req.responseHandler.success(req, res, payload)
}
