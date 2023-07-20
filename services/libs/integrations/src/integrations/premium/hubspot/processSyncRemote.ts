import {
  IGenerateStreamsContext,
  IIntegrationProcessRemoteSyncContext,
  ProcessIntegrationSyncHandler,
} from '@/types'
import { HubspotEntity, IHubspotIntegrationSettings } from './types'
import { IMember } from '@crowd/types'
import { HubspotFieldMapperFactory } from './field-mapper/mapperFactory'
import { HubspotMemberFieldMapper } from './field-mapper/memberFieldMapper'
import { RequestThrottler } from '@crowd/common'
import { batchCreateMembers } from './api/batchCreateMembers'
import { batchUpdateMembers } from './api/batchUpdateMembers'

const handler: ProcessIntegrationSyncHandler = async (
  membersToCreate: IMember[],
  membersToUpdate: IMember[],
  ctx: IIntegrationProcessRemoteSyncContext,
) => {
  let membersCreatedInHubspot

  const nangoId = `${ctx.tenantId}-${ctx.integration.platform}`

  const memberMapper = HubspotFieldMapperFactory.getFieldMapper(
    HubspotEntity.MEMBERS,
    ctx.memberAttributes,
    ctx.platforms,
  ) as HubspotMemberFieldMapper

  memberMapper.setFieldMap(
    (ctx.integration.settings as IHubspotIntegrationSettings).attributesMapping.members,
  )

  const integrationContext = {
    log: ctx.log,
    serviceSettings: {
      nangoId,
      nangoUrl: ctx.serviceSettings.nangoUrl,
      nangoSecretKey: ctx.serviceSettings.nangoSecretKey,
    },
  } as IGenerateStreamsContext

  const throttler = new RequestThrottler(100, 10000, ctx.log)

  if (membersToCreate.length > 0) {
    membersCreatedInHubspot = await batchCreateMembers(
      nangoId,
      membersToCreate,
      memberMapper,
      integrationContext,
      throttler,
    )
  }

  if (membersToUpdate.length > 0) {
    await batchUpdateMembers(nangoId, membersToUpdate, memberMapper, integrationContext, throttler)
  }

  return membersCreatedInHubspot || []
}

export default handler
