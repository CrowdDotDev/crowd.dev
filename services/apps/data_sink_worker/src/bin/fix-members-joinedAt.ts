import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG, UNLEASH_CONFIG } from '../conf'

import {
  getMembersWithJoinedAtUnixEpoch,
  getMemberRecentActivity,
  updateMemberJoinedAt,
} from '@crowd/data-access-layer/src/old/apps/data_sink_worker/scripts/fix-members-joinedAt'
import { getSqsClient } from '@crowd/sqs'
import {
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
  SearchSyncWorkerEmitter,
} from '@crowd/common_services'
import { getUnleashClient } from '@crowd/feature-flags'
import { getRedisClient } from '@crowd/redis'
import { getServiceTracer } from '@crowd/tracing'

/* eslint-disable @typescript-eslint/no-explicit-any */

const tracer = getServiceTracer()
const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: tenantId')
  process.exit(1)
}

const tenantId = processArguments[0]

setImmediate(async () => {
  const dbClient = await getDbConnection(DB_CONFIG())
  const sqsClient = getSqsClient(SQS_CONFIG())
  const unleash = await getUnleashClient(UNLEASH_CONFIG())
  const redis = await getRedisClient(REDIS_CONFIG())

  const store = new DbStore(log, dbClient)

  const priorityLevelRepo = new PriorityLevelContextRepository(store, log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(
    sqsClient,
    redis,
    tracer,
    unleash,
    loader,
    log,
  )
  await searchSyncWorkerEmitter.init()

  log.info('Started fixing members with joinedAt set to unix epoch!')

  const totalMembers = (
    await getMembersWithJoinedAtUnixEpoch(dbClient, tenantId, { countOnly: true })
  ).count

  if (totalMembers == 0) {
    log.info('No members with incorrect joinedAt and activities found!')
    process.exit(0)
  }

  log.info(`Found ${totalMembers} members`)

  let processedMembers = 0

  while (processedMembers < totalMembers) {
    const result = await getMembersWithJoinedAtUnixEpoch(dbClient, tenantId, {})

    for (const member of result.rows) {
      const memberId = member.id
      const activity = await getMemberRecentActivity(dbClient, tenantId, memberId)

      if (member.joinedAt != activity.timestamp) {
        // update member joinedAt if it's different from the latest activity timestamp
        await updateMemberJoinedAt(dbClient, tenantId, memberId, activity.timestamp)
        // sync member to open-search
        await searchSyncWorkerEmitter.triggerMemberSync(tenantId, memberId, false)
      }

      processedMembers++
    }

    log.info(`Processed ${processedMembers}/${totalMembers}!`)
  }

  log.info('Finished fixing members with incorrect joinedAt!')

  process.exit(0)
})
