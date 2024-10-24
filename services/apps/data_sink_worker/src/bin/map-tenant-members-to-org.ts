import {
  DataSinkWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
  SearchSyncWorkerEmitter,
} from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import DataSinkRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/dataSink.repo'
import MemberRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/member.repo'
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'
import { getRedisClient } from '@crowd/redis'
import { Client as TemporalClient, getTemporalClient } from '@crowd/temporal'

import { DB_CONFIG, QUEUE_CONFIG, REDIS_CONFIG, TEMPORAL_CONFIG } from '../conf'
import MemberService from '../service/member.service'
import { OrganizationService } from '../service/organization.service'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: tenantId')
  process.exit(1)
}

const tenantId = processArguments[0]

setImmediate(async () => {
  let temporal: TemporalClient | undefined
  // temp for production
  if (TEMPORAL_CONFIG().serverUrl) {
    temporal = await getTemporalClient(TEMPORAL_CONFIG())
  }

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const priorityLevelRepo = new PriorityLevelContextRepository(new DbStore(log, dbConnection), log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const redis = await getRedisClient(REDIS_CONFIG())

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const emitter = new DataSinkWorkerEmitter(queueClient, redis, loader, log)
  await emitter.init()

  const dataSinkRepo = new DataSinkRepository(store, log)
  const memberRepo = new MemberRepository(store, log)

  const segmentIds = await dataSinkRepo.getSegmentIds(tenantId)
  const segmentId = segmentIds[segmentIds.length - 1] // leaf segment id

  const searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(queueClient, redis, loader, log)
  await searchSyncWorkerEmitter.init()

  const memberService = new MemberService(store, searchSyncWorkerEmitter, temporal, redis, log)
  const orgService = new OrganizationService(store, log)

  const limit = 100
  let offset = 0
  let processedMembers = 0

  let currentMemberId = null
  let currentEmails = null

  try {
    const { totalCount } = await memberRepo.getMemberIdsAndEmailsAndCount(tenantId, segmentIds, {
      limit,
      offset,
      countOnly: true,
    })

    log.info({ tenantId }, `Total members found in the tenant: ${totalCount}`)

    do {
      const { members } = await memberRepo.getMemberIdsAndEmailsAndCount(tenantId, segmentIds, {
        limit,
        offset,
      })

      // member -> organization based on email domain
      for (const member of members) {
        currentMemberId = member.id
        currentEmails = member.emails
        if (member.emails) {
          const orgs = await memberService.assignOrganizationByEmailDomain(
            tenantId,
            segmentId,
            null,
            member.emails,
          )

          if (orgs.length > 0) {
            orgService.addToMember(tenantId, segmentId, member.id, orgs)

            for (const org of orgs) {
              await searchSyncWorkerEmitter.triggerOrganizationSync(
                tenantId,
                org.id,
                true,
                segmentId,
              )
            }

            await searchSyncWorkerEmitter.triggerMemberSync(tenantId, member.id, true, segmentId)
          }
        }

        processedMembers++
        log.info(`Processed member ${member.id}. Progress: ${processedMembers}/${totalCount}`)
      }
      offset += limit
    } while (totalCount > offset)

    log.info(`Member to organization association completed for the tenant ${tenantId}`)
    process.exit(0)
  } catch (err) {
    log.error(
      `Failed to assign member to organizations for the tenant ${tenantId}. Member ID: ${currentMemberId}, Emails: ${currentEmails}`,
      err,
    )
    process.exit(1)
  }
})
