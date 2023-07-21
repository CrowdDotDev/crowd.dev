import { StartIntegrationSyncHandler } from '@/types'
import { HubspotEntity, IHubspotIntegrationSettings } from './types'

const handler: StartIntegrationSyncHandler = async (ctx) => {
  const settings = ctx.integration.settings as IHubspotIntegrationSettings
  if (settings.enabledFor.includes(HubspotEntity.MEMBERS)) {
    // sync members
    await ctx.integrationSyncWorkerEmitter.triggerSyncMarkedMembers(
      ctx.tenantId,
      ctx.integration.id,
    )
  }

  if (settings.enabledFor.includes(HubspotEntity.ORGANIZATIONS)) {
    // sync orgs
    await ctx.integrationSyncWorkerEmitter.triggerSyncMarkedOrganizations(
      ctx.tenantId,
      ctx.integration.id,
    )
  }
}

export default handler
