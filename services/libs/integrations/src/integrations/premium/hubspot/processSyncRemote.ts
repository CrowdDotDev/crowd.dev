import { RequestThrottler } from '@crowd/common'
import {
  AutomationSyncTrigger,
  Entity,
  HubspotSettings,
  IMember,
  IOrganization,
} from '@crowd/types'

import {
  IGenerateStreamsContext,
  IIntegrationProcessRemoteSyncContext,
  ProcessIntegrationSyncHandler,
} from '../../../types'

import { addContactsToList } from './api/addContactsToList'
import { batchCreateMembers } from './api/batchCreateMembers'
import { batchCreateOrganizations } from './api/batchCreateOrganizations'
import { batchUpdateMembers } from './api/batchUpdateMembers'
import { batchUpdateOrganizations } from './api/batchUpdateOrganizations'
import { IBatchOperationResult } from './api/types'
import { HubspotFieldMapperFactory } from './field-mapper/mapperFactory'
import { HubspotMemberFieldMapper } from './field-mapper/memberFieldMapper'
import { HubspotOrganizationFieldMapper } from './field-mapper/organizationFieldMapper'
import { HubspotEntity, IHubspotIntegrationSettings } from './types'

const handler: ProcessIntegrationSyncHandler = async <T>(
  toCreate: T[],
  toUpdate: T[],
  entity: Entity,
  ctx: IIntegrationProcessRemoteSyncContext,
): Promise<IBatchOperationResult> => {
  const nangoId = `${ctx.tenantId}-${ctx.integration.platform}`

  const integrationContext = {
    log: ctx.log,
    serviceSettings: {
      nangoId,
      nangoUrl: ctx.serviceSettings.nangoUrl,
      nangoSecretKey: ctx.serviceSettings.nangoSecretKey,
    },
  } as IGenerateStreamsContext

  const settings = ctx.integration.settings as IHubspotIntegrationSettings

  const throttler = new RequestThrottler(100, 10000, ctx.log)

  switch (entity) {
    case Entity.MEMBERS: {
      let membersCreatedInHubspot = []
      let membersUpdatedInHubspot = []

      const memberMapper = HubspotFieldMapperFactory.getFieldMapper(
        HubspotEntity.MEMBERS,
        settings.hubspotId,
        settings.crowdAttributes,
        settings.platforms,
      ) as HubspotMemberFieldMapper

      memberMapper.setFieldMap(
        (ctx.integration.settings as IHubspotIntegrationSettings).attributesMapping.members,
      )

      if (toCreate.length > 0) {
        membersCreatedInHubspot = await batchCreateMembers(
          nangoId,
          toCreate as IMember[],
          memberMapper,
          integrationContext,
          throttler,
        )
      }

      if (toUpdate.length > 0) {
        membersUpdatedInHubspot = await batchUpdateMembers(
          nangoId,
          toUpdate as IMember[],
          memberMapper,
          integrationContext,
          throttler,
        )
      }

      // we should also add members to hubspot lists, if it's coming from an automation
      if (
        ctx.automation &&
        ctx.automation.trigger === AutomationSyncTrigger.MEMBER_ATTRIBUTES_MATCH
      ) {
        const vids: string[] = [
          ...membersCreatedInHubspot.map((m) => m.sourceId),
          ...(toUpdate as IMember[]).map((m) => m.attributes.sourceId.hubspot),
        ]

        await addContactsToList(
          nangoId,
          (ctx.automation.settings as HubspotSettings).contactList,
          vids,
          integrationContext,
          throttler,
        )
      }

      return { created: membersCreatedInHubspot, updated: membersUpdatedInHubspot }
    }
    case Entity.ORGANIZATIONS: {
      let companiesCreatedInHubspot = []
      let companiesUpdatedInHubspot = []

      const organizationMapper = HubspotFieldMapperFactory.getFieldMapper(
        HubspotEntity.ORGANIZATIONS,
        settings.hubspotId,
      ) as HubspotOrganizationFieldMapper

      organizationMapper.setFieldMap(
        (ctx.integration.settings as IHubspotIntegrationSettings).attributesMapping.organizations,
      )

      if (toCreate.length > 0) {
        companiesCreatedInHubspot = await batchCreateOrganizations(
          nangoId,
          toCreate as IOrganization[],
          organizationMapper,
          integrationContext,
          throttler,
        )
      }

      if (toUpdate.length > 0) {
        companiesUpdatedInHubspot = await batchUpdateOrganizations(
          nangoId,
          toUpdate as IOrganization[],
          organizationMapper,
          integrationContext,
          throttler,
        )
      }

      return { created: companiesCreatedInHubspot, updated: companiesUpdatedInHubspot }
    }
    default: {
      const message = `Unsupported entity ${entity} while processing HubSpot sync remote!`
      ctx.log.error(message)
      throw new Error(message)
    }
  }
}

export default handler
