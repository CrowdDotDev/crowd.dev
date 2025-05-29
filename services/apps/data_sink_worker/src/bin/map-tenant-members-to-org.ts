import { DataSinkWorkerEmitter, SearchSyncWorkerEmitter } from '@crowd/common_services'
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

setImmediate(async () => {
  let temporal: TemporalClient | undefined
  // temp for production
  if (TEMPORAL_CONFIG().serverUrl) {
    temporal = await getTemporalClient(TEMPORAL_CONFIG())
  }

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const redis = await getRedisClient(REDIS_CONFIG())

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const emitter = new DataSinkWorkerEmitter(queueClient, log)
  await emitter.init()

  const dataSinkRepo = new DataSinkRepository(store, log)
  const memberRepo = new MemberRepository(store, log)

  const segmentIds = await dataSinkRepo.getSegmentIds()
  const segmentId = segmentIds[segmentIds.length - 1] // leaf segment id

  const searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(queueClient, log)
  await searchSyncWorkerEmitter.init()

  const memberService = new MemberService(store, searchSyncWorkerEmitter, temporal, redis, log)
  const orgService = new OrganizationService(store, log)

  const limit = 100
  let offset = 0
  let processedMembers = 0

  let currentMemberId = null
  let currentEmails = null

  try {
    const { totalCount } = await memberRepo.getMemberIdsAndEmailsAndCount(segmentIds, {
      limit,
      offset,
      countOnly: true,
    })

    log.info(`Total members found in the tenant: ${totalCount}`)

    do {
      const { members } = await memberRepo.getMemberIdsAndEmailsAndCount(segmentIds, {
        limit,
        offset,
      })

      // member -> organization based on email domain
      for (const member of members) {
        currentMemberId = member.id
        currentEmails = member.emails
        if (member.emails) {
          const orgs = await memberService.assignOrganizationByEmailDomain(null, member.emails)

          if (orgs.length > 0) {
            orgService.addToMember([segmentId], member.id, orgs)

            for (const org of orgs) {
              await searchSyncWorkerEmitter.triggerOrganizationSync(org.id, true, segmentId)
            }

            await searchSyncWorkerEmitter.triggerMemberSync(member.id, true, segmentId)
          }
        }

        processedMembers++
        log.info(`Processed member ${member.id}. Progress: ${processedMembers}/${totalCount}`)
      }
      offset += limit
    } while (totalCount > offset)

    log.info(`Member to organization association completed`)
    process.exit(0)
  } catch (err) {
    log.error(
      `Failed to assign member to organizations. Member ID: ${currentMemberId}, Emails: ${currentEmails}`,
      err,
    )
    process.exit(1)
  }
})
