import { ProcessDataHandler } from '@/types'
import { HubspotEntity, HubspotStream, IHubspotData, IHubspotIntegrationSettings } from './types'
import { IntegrationResultType } from '@crowd/types'
import { HubspotFieldMapperFactory } from './field-mapper/mapperFactory'

const processContact: ProcessDataHandler = async (ctx) => {
  const data = ctx.data as IHubspotData

  const memberMapper = HubspotFieldMapperFactory.getFieldMapper(HubspotEntity.MEMBERS)
  const orgMapper = HubspotFieldMapperFactory.getFieldMapper(HubspotEntity.ORGANIZATIONS)

  const settings = ctx.integration.settings as IHubspotIntegrationSettings

  memberMapper.setHubspotId(settings.hubspotId)
  memberMapper.setFieldMap(settings.attributesMapping[HubspotEntity.MEMBERS])
  orgMapper.setFieldMap(settings.attributesMapping[HubspotEntity.ORGANIZATIONS])
  orgMapper.setHubspotId(settings.hubspotId)

  const member = memberMapper.getEntity(data.element, orgMapper)

  await ctx.publishCustom(member, IntegrationResultType.MEMBER_ENRICH)
}

const processCompany: ProcessDataHandler = async (ctx) => {
  const data = ctx.data as IHubspotData

  const orgMapper = HubspotFieldMapperFactory.getFieldMapper(HubspotEntity.ORGANIZATIONS)

  const settings = ctx.integration.settings as IHubspotIntegrationSettings

  orgMapper.setFieldMap(settings.attributesMapping[HubspotEntity.ORGANIZATIONS])
  orgMapper.setHubspotId(settings.hubspotId)

  const organization = orgMapper.getEntity(data.element, orgMapper)

  await ctx.publishCustom(organization, IntegrationResultType.ORGANIZATION_ENRICH)
}

const handler: ProcessDataHandler = async (ctx) => {
  const data = ctx.data as IHubspotData

  // only process contacts with e-mails, this will be the unique identifier when enriching
  if (data.type === HubspotStream.MEMBERS && (data.element.properties as any).email) {
    await processContact(ctx)
  } else if (data.type === HubspotStream.ORGANIZATIONS && (data.element.properties as any).name) {
    await processCompany(ctx)
  }
}

export default handler
