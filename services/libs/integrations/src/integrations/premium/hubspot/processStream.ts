import { RequestThrottler } from '@crowd/common'

import { ProcessStreamHandler } from '../../../types'

import { getAllCompanies } from './api/companies'
import { getAllContacts } from './api/contacts'
import { HubspotFieldMapperFactory } from './field-mapper/mapperFactory'
import { HubspotMemberFieldMapper } from './field-mapper/memberFieldMapper'
import { HubspotOrganizationFieldMapper } from './field-mapper/organizationFieldMapper'
import {
  HubspotEntity,
  HubspotStream,
  IHubspotContact,
  IHubspotData,
  IHubspotIntegrationSettings,
  IHubspotObject,
} from './types'

const processRootStream: ProcessStreamHandler = async (ctx) => {
  const throttler = new RequestThrottler(99, 11000, ctx.log)

  const settings = ctx.integration.settings as IHubspotIntegrationSettings

  // hubspot might have long running root stream, change stream queue message visibility to 7 hours
  await ctx.setMessageVisibilityTimeout(60 * 60 * 7)

  const streams = ctx.stream.data as HubspotStream[]

  if (streams.includes(HubspotStream.MEMBERS)) {
    const memberMapper = HubspotFieldMapperFactory.getFieldMapper(
      HubspotEntity.MEMBERS,
      settings.hubspotId,
      settings.crowdAttributes,
      settings.platforms,
    ) as HubspotMemberFieldMapper
    memberMapper.setFieldMap(settings.attributesMapping.members)
    memberMapper.setHubspotId(settings.hubspotId)

    const organizationsEnabled = settings.enabledFor.includes(HubspotEntity.ORGANIZATIONS)

    let organizationMapper

    if (organizationsEnabled) {
      organizationMapper = HubspotFieldMapperFactory.getFieldMapper(
        HubspotEntity.ORGANIZATIONS,
        settings.hubspotId,
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
        await ctx.processData<IHubspotData>({
          type: HubspotStream.MEMBERS,
          element: contact as IHubspotContact,
        })
      }

      contactsPage = await contactsGenerator.next()
    }
  }

  if (streams.includes(HubspotStream.ORGANIZATIONS)) {
    const organizationMapper = HubspotFieldMapperFactory.getFieldMapper(
      HubspotEntity.ORGANIZATIONS,
      settings.hubspotId,
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
        await ctx.processData<IHubspotData>({
          type: HubspotStream.ORGANIZATIONS,
          element: company as IHubspotObject,
        })
      }

      companyPage = await companyGenerator.next()
    }
  }
}

const handler: ProcessStreamHandler = async (ctx) => {
  await processRootStream(ctx)
}

export default handler
