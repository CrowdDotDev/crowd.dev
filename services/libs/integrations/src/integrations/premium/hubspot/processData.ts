import { ProcessDataHandler } from '@/types'
import { HubspotEntity, HubspotStream, IHubspotData, IHubspotIntegrationSettings } from './types'
import { IntegrationResultType } from '@crowd/types'
import { HubspotFieldMapper } from './hubspotFieldMapper'

const processContact: ProcessDataHandler = async (ctx) => {
  const data = ctx.data as IHubspotData

  const mapper = new HubspotFieldMapper()
  const settings = ctx.integration.settings as IHubspotIntegrationSettings

  mapper.setHubspotId(settings.hubspotId)
  mapper.setMembersFieldMap(settings.attributesMapping[HubspotEntity.MEMBERS])

  const member = mapper.getMember(data.element)

  await ctx.publishCustom(member, IntegrationResultType.MEMBER_ENRICH)
}

const handler: ProcessDataHandler = async (ctx) => {
  const data = ctx.data as IHubspotData

  // only process contacts with e-mails, this will be the unique identifier when enriching
  if (data.type === HubspotStream.MEMBERS && (data.element.properties as any).email) {
    await processContact(ctx)
  }
}

export default handler
