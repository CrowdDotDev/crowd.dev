import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG, UNLEASH_CONFIG } from '../conf'

import {
  getMembersWithWrongDisplayName,
  updateMemberDisplayName,
} from '@crowd/data-access-layer/src/old/apps/data_sink_worker/scripts/fix-member-displayName'
import { getProperDisplayName } from '@crowd/common'
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

setImmediate(async () => {
  const dbClient = await getDbConnection(DB_CONFIG())
  const sqsClient = getSqsClient(SQS_CONFIG())
  const unleash = await getUnleashClient(UNLEASH_CONFIG())
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

  const searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(
    sqsClient,
    redis,
    tracer,
    unleash,
    loader,
    log,
  )
  await searchSyncWorkerEmitter.init()

  while (processedMembers < totalWrongMembers) {
    const result = await getMembersWithWrongDisplayName(dbClient, {})
    fixableMembers = result.rows

    for (const member of fixableMembers) {
      const displayName = getProperDisplayName(member.displayName.split(' ')[0])
      await updateMemberDisplayName(dbClient, member.id, displayName)

      processedMembers += 1
    }

    log.info(`Processed ${processedMembers}/${totalWrongMembers} members`)
  }

  log.info('Finished fixing members with incorrect displayName!')

  process.exit(0)
})
