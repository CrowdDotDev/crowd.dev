import sendNodeMicroserviceMessage from '../../nodeMicroserviceSQS'
import TenantService from '../../../../../services/tenantService'

/**
 * Gets all tenants and send a message to start the weekly analytics function.
 */
async function weeklyAnalyticsEmailsCoordinator(): Promise<void> {
  const tenants = await TenantService._findAndCountAllForEveryUser({})

  for (const tenant of tenants.rows) {
    await sendNodeMicroserviceMessage({ service: 'weekly-analytics-emails', tenant: tenant.id })
  }
}

export default weeklyAnalyticsEmailsCoordinator
