import {
  IGenerateStreamsContext,
  IIntegrationProcessRemoteSyncContext,
  ProcessIntegrationSyncHandler,
} from '@/types'
import { HubspotEntity, IHubspotIntegrationSettings } from './types'
import { Entity, IMember, IOrganization } from '@crowd/types'
import { HubspotFieldMapperFactory } from './field-mapper/mapperFactory'
import { HubspotMemberFieldMapper } from './field-mapper/memberFieldMapper'
import { RequestThrottler } from '@crowd/common'
import { batchCreateMembers } from './api/batchCreateMembers'
import { batchUpdateMembers } from './api/batchUpdateMembers'
import { HubspotOrganizationFieldMapper } from './field-mapper/organizationFieldMapper'
import { batchCreateOrganizations } from './api/batchCreateOrganizations'
import { batchUpdateOrganizations } from './api/batchUpdateOrganizations'
import { IBatchOperationResult } from './api/types'

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
      let membersCreatedInHubspot

      const memberMapper = HubspotFieldMapperFactory.getFieldMapper(
        HubspotEntity.MEMBERS,
        settings.hubspotId,
        ctx.memberAttributes,
        ctx.platforms,
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
        await batchUpdateMembers(
          nangoId,
          toUpdate as IMember[],
          memberMapper,
          integrationContext,
          throttler,
        )
      }

      return membersCreatedInHubspot || []
    }
    case Entity.ORGANIZATIONS: {
      let companiesCreatedInHubspot

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
        await batchUpdateOrganizations(
          nangoId,
          toUpdate as IOrganization[],
          organizationMapper,
          integrationContext,
          throttler,
        )
      }

      return companiesCreatedInHubspot || []
    }
    default: {
      const message = `Unsupported entity ${entity} while processing HubSpot sync remote!`
      ctx.log.error(message)
      throw new Error(message)
    }
  }
}

export default handler
