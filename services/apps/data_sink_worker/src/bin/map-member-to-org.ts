import { DB_CONFIG, REDIS_CONFIG, TEMPORAL_CONFIG, UNLEASH_CONFIG, QUEUE_CONFIG } from '../conf'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import MemberRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/member.repo'
import MemberService from '../service/member.service'
import DataSinkRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/dataSink.repo'
import { OrganizationService } from '../service/organization.service'
import { getUnleashClient } from '@crowd/feature-flags'
import { Client as TemporalClient, getTemporalClient } from '@crowd/temporal'
import { getRedisClient } from '@crowd/redis'
import {
  DataSinkWorkerEmitter,
  NodejsWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
  SearchSyncWorkerEmitter,
} from '@crowd/common_services'
import { MemberIdentityType } from '@crowd/types'
import { QueueFactory } from '@crowd/queue'

const tracer = getServiceTracer()
const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: memberId')
  process.exit(1)
}

const memberId = processArguments[0]

setImmediate(async () => {
  const unleash = await getUnleashClient(UNLEASH_CONFIG())

  let temporal: TemporalClient | undefined
  // temp for production
  if (TEMPORAL_CONFIG().serverUrl) {
    temporal = await getTemporalClient(TEMPORAL_CONFIG())
  }

  const redis = await getRedisClient(REDIS_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const priorityLevelRepo = new PriorityLevelContextRepository(store, log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const emitter = new DataSinkWorkerEmitter(queueClient, redis, tracer, unleash, loader, log)
  await emitter.init()

  const dataSinkRepo = new DataSinkRepository(store, log)
  const memberRepo = new MemberRepository(store, log)

  const nodejsWorkerEmitter = new NodejsWorkerEmitter(
    queueClient,
    redis,
    tracer,
    unleash,
    loader,
    log,
  )
  await nodejsWorkerEmitter.init()

  const searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(
    queueClient,
    redis,
    tracer,
    unleash,
    loader,
    log,
  )
  await searchSyncWorkerEmitter.init()

  const memberService = new MemberService(
    store,
    nodejsWorkerEmitter,
    searchSyncWorkerEmitter,
    unleash,
    temporal,
    redis,
    log,
  )
  const orgService = new OrganizationService(store, log)

  try {
    const member = await memberRepo.findById(memberId)

    if (!member) {
      log.error({ memberId }, 'Member not found!')
      process.exit(1)
    }

    const identities = await memberRepo.getIdentities(memberId, member.tenantId)
    log.info(`Processing memberId: ${member.id}`)

    const segmentIds = await dataSinkRepo.getSegmentIds(member.tenantId)
    const segmentId = segmentIds[segmentIds.length - 1] // leaf segment id

    const emailIdentities = identities.filter(
      (i) => i.verified && i.type === MemberIdentityType.EMAIL,
    )
    if (emailIdentities.length > 0) {
      const emails = emailIdentities.map((i) => i.value)
      log.info({ memberId, emails }, 'Member emails!')
      const orgs = await memberService.assignOrganizationByEmailDomain(
        member.tenantId,
        segmentId,
        null,
        emails,
      )

      if (orgs.length > 0) {
        log.info('Organizations found with matching email domains:', JSON.stringify(orgs))
        orgService.addToMember(member.tenantId, segmentId, member.id, orgs)

        for (const org of orgs) {
          await searchSyncWorkerEmitter.triggerOrganizationSync(
            member.tenantId,
            org.id,
            true,
            segmentId,
          )
        }

        await searchSyncWorkerEmitter.triggerMemberSync(member.tenantId, member.id, true, segmentId)
        log.info('Done mapping member to organizations!')
      } else {
        log.info('No organizations found with matching email domains!')
      }
    } else {
      log.info('No emails found for member!')
    }

    process.exit(0)
  } catch (err) {
    log.error('Failed to map organizations for member!', err)
    process.exit(1)
  }
})
