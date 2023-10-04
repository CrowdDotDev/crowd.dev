import { DATABASE_IOC, DbStore } from '@crowd/database'
import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import {
  DataSinkWorkerEmitter,
  NodejsWorkerEmitter,
  SQS_IOC,
  SearchSyncWorkerEmitter,
  SqsClient,
} from '@crowd/sqs'
import { APP_IOC_MODULE } from 'ioc'
import DataSinkRepository from '../repo/dataSink.repo'
import MemberRepository from '../repo/member.repo'
import MemberService from '../service/member.service'
import { OrganizationService } from '../service/organization.service'

setImmediate(async () => {
  await APP_IOC_MODULE(3)
  const ioc = IOC()
  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const processArguments = process.argv.slice(2)
  const memberId = processArguments[0]
  if (processArguments.length !== 1) {
    log.error('Expected 1 argument: memberId')
    process.exit(1)
  }

  const sqsClient = ioc.get<SqsClient>(SQS_IOC.client)
  const emitter = new DataSinkWorkerEmitter(sqsClient, log)
  await emitter.init()

  const store = ioc.get<DbStore>(DATABASE_IOC.store)

  const dataSinkRepo = new DataSinkRepository(store, log)
  const memberRepo = new MemberRepository(store, log)

  const nodejsWorkerEmitter = ioc.get<NodejsWorkerEmitter>(SQS_IOC.emitters.nodejsWorker)
  const searchSyncWorkerEmitter = ioc.get<SearchSyncWorkerEmitter>(
    SQS_IOC.emitters.searchSyncWorker,
  )

  const memberService = new MemberService(store, nodejsWorkerEmitter, searchSyncWorkerEmitter, log)
  const orgService = new OrganizationService(store, log)

  try {
    const member = await memberRepo.findById(memberId)

    if (!member) {
      log.error({ memberId }, 'Member not found!')
      process.exit(1)
    }

    log.info(`Processing memberId: ${member.id}`)

    const segmentIds = await dataSinkRepo.getSegmentIds(member.tenantId)
    const segmentId = segmentIds[segmentIds.length - 1] // leaf segment id

    if (member.emails) {
      log.info('Member emails:', JSON.stringify(member.emails))
      const orgs = await memberService.assignOrganizationByEmailDomain(
        member.tenantId,
        segmentId,
        null,
        member.emails,
      )

      if (orgs.length > 0) {
        log.info('Organizations found with matching email domains:', JSON.stringify(orgs))
        orgService.addToMember(member.tenantId, segmentId, member.id, orgs)

        for (const org of orgs) {
          await searchSyncWorkerEmitter.triggerOrganizationSync(member.tenantId, org.id)
        }

        await searchSyncWorkerEmitter.triggerMemberSync(member.tenantId, member.id)
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
