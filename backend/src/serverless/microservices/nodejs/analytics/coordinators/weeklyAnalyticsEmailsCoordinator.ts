import { NodeWorkerMessage, NodeWorkerMessageType } from '../../../../types/worketTypes'
import { sendNodeWorkerMessage } from '../../../../utils/nodeWorkerSQS'
import { KUBE_MODE } from '../../../../../config/index'
import sendNodeMicroserviceMessage from '../../nodeMicroserviceSQS'
import TenantService from '../../../../../services/tenantService'

/**
 * Gets all tenants and send a message to start the weekly analytics function.
 */
async function weeklyAnalyticsEmailsCoordinator(): Promise<void> {
  const tenants = await TenantService._findAndCountAllForEveryUser({})

  for (const tenant of tenants.rows) {
    if (KUBE_MODE) {
      const payload = {
        type: NodeWorkerMessageType.WEEKLY_ANALYTICS_EMAILS,
        tenant: tenant.id,
      }
      await sendNodeWorkerMessage(tenant, payload as NodeWorkerMessage)
    } else {
      await sendNodeMicroserviceMessage({ service: 'weekly-analytics-emails', tenant: tenant.id })
    }
  }
}
export default weeklyAnalyticsEmailsCoordinator
