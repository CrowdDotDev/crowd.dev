import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG, UNLEASH_CONFIG } from '../conf'

import {
  checkIfMemberExists,
  deleteMemberSegments,
  deleteMember,
  deleteMemberActivities,
} from '@crowd/data-access-layer/src/old/apps/data_sink_worker/scripts/delete-members'
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
  log.error('Expected 1 argument: memberIds')
  process.exit(1)
}

const memberIds = processArguments[0].split(',')

setImmediate(async () => {
  const dbClient = await getDbConnection(DB_CONFIG())
  const sqsClient = getSqsClient(SQS_CONFIG())
  const unleash = await getUnleashClient(UNLEASH_CONFIG())
  const redis = await getRedisClient(REDIS_CONFIG())

  const store = new DbStore(log, dbClient)

  const priorityLevelRepo = new PriorityLevelContextRepository(store, log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  log.info(`Started deleting members with ids: ${memberIds.join(', ')}`)

  const totalMemberIds = memberIds.length
  let processedMembers = 0

  const searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(
    sqsClient,
    redis,
    tracer,
    unleash,
    loader,
    log,
  )

  await searchSyncWorkerEmitter.init()

  while (totalMemberIds > 0) {
    const memberId = memberIds.shift()

    if (!checkIfMemberExists(dbClient, memberId)) {
      log.info(`Member not found: ${memberId}`)
      continue
    }

    await deleteMemberActivities(dbClient, memberId)

    await deleteMemberSegments(dbClient, memberId)

    await deleteMember(dbClient, memberId)

    processedMembers += 1

    log.info(`deleted ${processedMembers}/${totalMemberIds} members!`)
  }

  log.info('Finished deleting members!')

  process.exit(0)
})
