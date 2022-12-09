import { PostHog } from 'posthog-node'
import { API_CONFIG, POSTHOG_CONFIG } from '../config'
import { Edition } from '../types/common'

export default async function setPosthogTenantProperties(
  tenant: any,
  posthog: PostHog,
  database: any,
) {
  if (POSTHOG_CONFIG.apiKey && API_CONFIG.edition === Edition.CROWD_HOSTED) {
    const automationCount = await database.automation.count({
      where: {
        tenantId: tenant.id,
      },
    })

    const payload = {
      groupType: 'tenant',
      groupKey: tenant.id,
      properties: {
        name: tenant.name,
        plan: tenant.plan,
        automationCount: automationCount.toString(),
      },
    }
    console.log(payload)
    posthog.groupIdentify(payload)
  }
}
