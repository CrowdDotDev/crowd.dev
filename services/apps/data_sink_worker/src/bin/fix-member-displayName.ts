import { getProperDisplayName } from '@crowd/common'
import {
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
  SearchSyncWorkerEmitter,
} from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import {
  getMembersWithWrongDisplayName,
  updateMemberDisplayName,
} from '@crowd/data-access-layer/src/old/apps/data_sink_worker/scripts/fix-member-displayName'
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

  log.info('Started fixing members displayName!')

  let fixableMembers
  let processedMembers = 0

  const totalWrongMembers = (await getMembersWithWrongDisplayName(dbClient, { countOnly: true }))
    .count

  if (totalWrongMembers == 0) {
    log.info('No members with incorrect displayName found!')
    process.exit(0)
  }

  log.info(`Found ${totalWrongMembers} members!`)

  const searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(queueClient, redis, loader, log)
  await searchSyncWorkerEmitter.init()

  while (processedMembers < totalWrongMembers) {
    const result = await getMembersWithWrongDisplayName(dbClient, {})
    fixableMembers = result.rows

    for (const member of fixableMembers) {
      const displayName = getProperDisplayName(member.displayName)
      await updateMemberDisplayName(dbClient, member.id, displayName)

      searchSyncWorkerEmitter.triggerMemberSync(tenantId, member.id, false)

      processedMembers += 1
    }

    log.info(`Processed ${processedMembers}/${totalWrongMembers} members`)
  }

  log.info('Finished fixing members with incorrect displayName!')

  process.exit(0)
})
