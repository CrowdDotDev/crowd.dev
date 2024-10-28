import {
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
  SearchSyncWorkerEmitter,
} from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import {
  getMemberRecentActivity,
  getMembersWithJoinedAtUnixEpoch,
  updateMemberJoinedAt,
} from '@crowd/data-access-layer/src/old/apps/data_sink_worker/scripts/fix-members-joinedAt'
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'
import { getRedisClient } from '@crowd/redis'

import { DB_CONFIG, QUEUE_CONFIG, REDIS_CONFIG } from '../conf'

/* eslint-disable @typescript-eslint/no-explicit-any */

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: tenantId')
  process.exit(1)
}

const tenantId = processArguments[0]

setImmediate(async () => {
  const dbClient = await getDbConnection(DB_CONFIG())
  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const redis = await getRedisClient(REDIS_CONFIG())

  const store = new DbStore(log, dbClient)

  const priorityLevelRepo = new PriorityLevelContextRepository(store, log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(queueClient, redis, loader, log)
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
