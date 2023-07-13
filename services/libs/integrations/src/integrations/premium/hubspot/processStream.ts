import { ProcessStreamHandler } from '@/types'
import {
  HubspotEntity,
  HubspotStream,
  IHubspotContact,
  IHubspotData,
  IHubspotIntegrationSettings,
  IHubspotObject,
} from './types'
import { getAllContacts } from './api/contacts'
import { RequestThrottler } from '../../requestThrottler'
import { HubspotFieldMapperFactory } from './field-mapper/mapperFactory'
import { HubspotMemberFieldMapper } from './field-mapper/memberFieldMapper'
import { HubspotOrganizationFieldMapper } from './field-mapper/organizationFieldMapper'
import { getAllCompanies } from './api/companies'

const processRootStream: ProcessStreamHandler = async (ctx) => {
  const throttler = new RequestThrottler(100, 10000, ctx)

  const settings = ctx.integration.settings as IHubspotIntegrationSettings

  if (ctx.stream.identifier === HubspotStream.MEMBERS) {
    const memberMapper = HubspotFieldMapperFactory.getFieldMapper(
      HubspotEntity.MEMBERS,
    ) as HubspotMemberFieldMapper
    memberMapper.setFieldMap(settings.attributesMapping.members)

    const organizationsEnabled = settings.enabledFor.includes(HubspotEntity.ORGANIZATIONS)

    let organizationMapper

    if (organizationsEnabled) {
      organizationMapper = HubspotFieldMapperFactory.getFieldMapper(
        HubspotEntity.ORGANIZATIONS,
      ) as HubspotOrganizationFieldMapper

      organizationMapper.setFieldMap(settings.attributesMapping.organizations)
    }

    const contactsGenerator = getAllContacts(
      ctx.serviceSettings.nangoId,
      memberMapper,
      organizationMapper,
      ctx,
      throttler,
      organizationsEnabled,
    )

    let contactsPage = await contactsGenerator.next()

    while (!contactsPage.done) {
      const contacts = contactsPage.value as IHubspotContact[]

      while (contacts.length > 0) {
        const contact = contacts.shift()
        await ctx.publishData<IHubspotData>({
          type: HubspotStream.MEMBERS,
          element: contact as IHubspotContact,
        })
      }

      contactsPage = await contactsGenerator.next()
    }
  } else if (ctx.stream.identifier === HubspotStream.ORGANIZATIONS) {
    const organizationMapper = HubspotFieldMapperFactory.getFieldMapper(
      HubspotEntity.ORGANIZATIONS,
    ) as HubspotOrganizationFieldMapper

    organizationMapper.setFieldMap(settings.attributesMapping.organizations)

    const companyGenerator = getAllCompanies(
      ctx.serviceSettings.nangoId,
      organizationMapper,
      ctx,
      throttler,
    )

    let companyPage = await companyGenerator.next()

    while (!companyPage.done) {
      const companies = companyPage.value as IHubspotObject[]

      while (companies.length > 0) {
        const company = companies.shift()
        await ctx.publishData<IHubspotData>({
          type: HubspotStream.ORGANIZATIONS,
          element: company as IHubspotObject,
        })
      }

      companyPage = await companyGenerator.next()
    }
  } else {
    await ctx.abortWithError(`Unknown root stream identifier: ${ctx.stream.identifier}`)
  }
}

const handler: ProcessStreamHandler = async (ctx) => {
  await processRootStream(ctx)
}

export default handler
