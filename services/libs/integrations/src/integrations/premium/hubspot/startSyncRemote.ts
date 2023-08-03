import { StartIntegrationSyncHandler } from '@/types'
import { HubspotEntity, IHubspotIntegrationSettings } from './types'
import { AutomationSyncTrigger } from '@crowd/types'

const handler: StartIntegrationSyncHandler = async (ctx) => {
  const settings = ctx.integration.settings as IHubspotIntegrationSettings
  if (settings.enabledFor.includes(HubspotEntity.MEMBERS)) {
    // sync members
    await ctx.integrationSyncWorkerEmitter.triggerSyncMarkedMembers(
      ctx.tenantId,
      ctx.integration.id,
    )

    const memberSyncAutomations = ctx.automations.filter(
      (a) => a.trigger === AutomationSyncTrigger.MEMBER_ATTRIBUTES_MATCH,
    )

    // sync filter automations
    for (const automation of memberSyncAutomations) {
      await ctx.integrationSyncWorkerEmitter.triggerOnboardAutomation(
        ctx.tenantId,
        ctx.integration.id,
        automation.id,
        automation.trigger as AutomationSyncTrigger,
      )
    }
  }

  if (settings.enabledFor.includes(HubspotEntity.ORGANIZATIONS)) {
    // sync orgs
    await ctx.integrationSyncWorkerEmitter.triggerSyncMarkedOrganizations(
      ctx.tenantId,
      ctx.integration.id,
    )

    const organizationSyncAutomations = ctx.automations.filter(
      (a) => a.trigger === AutomationSyncTrigger.ORGANIZATION_ATTRIBUTES_MATCH,
    )

    // sync filter automations
    for (const automation of organizationSyncAutomations) {
      await ctx.integrationSyncWorkerEmitter.triggerOnboardAutomation(
        ctx.tenantId,
        ctx.integration.id,
        automation.id,
        automation.trigger as AutomationSyncTrigger,
      )
    }
  }
}

export default handler
