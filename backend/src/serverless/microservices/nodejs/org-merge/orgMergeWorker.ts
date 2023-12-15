import { getRedisClient, RedisPubSubEmitter } from '@crowd/redis'
import { ApiWebsocketMessage } from '@crowd/types'
import { REDIS_CONFIG } from '../../../../conf'
import getUserContext from '../../../../database/utils/getUserContext'
import OrganizationService from '../../../../services/organizationService'

async function doNotifyFrontend({ log, success, tenantId, primaryOrgId, secondaryOrgId, original, toMerge }) {
  const redis = await getRedisClient(REDIS_CONFIG, true)
  const apiPubSubEmitter = new RedisPubSubEmitter(
    'api-pubsub',
    redis,
    (err) => {
      log.error({ err }, 'Error in api-ws emitter!')
    },
    log,
  )

  apiPubSubEmitter.emit(
    'user',
    new ApiWebsocketMessage(
      'org-merge',
      JSON.stringify({
        success,
        tenantId,
        primaryOrgId,
        secondaryOrgId,
        original,
        toMerge
      }),
      undefined,
      tenantId,
    ),
  )
}

async function orgMergeWorker(
  tenantId: string,
  primaryOrgId: string,
  secondaryOrgId: string,
  notifyFrontend: boolean,
) {
  const userContext = await getUserContext(tenantId)

  const organizationService = new OrganizationService(userContext)

  let success = true
  let original
  let toMerge
  try {
    const response = await organizationService.mergeSync(primaryOrgId, secondaryOrgId)

    original = response.original
    toMerge = response.toMerge
  } catch (err) {
    userContext.log.error(err, 'Error merging orgs')
    success = false
  }

  if (notifyFrontend) {
    await doNotifyFrontend({
      log: userContext.log,
      success,
      tenantId,
      primaryOrgId,
      secondaryOrgId,
      original,
      toMerge
    })
  }
}
export { orgMergeWorker }
