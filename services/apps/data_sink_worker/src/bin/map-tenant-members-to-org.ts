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

  if (processArguments.length !== 1) {
    log.error('Expected 1 argument: tenantId')
    process.exit(1)
  }

  const tenantId = processArguments[0]

  const sqsClient = ioc.get<SqsClient>(SQS_IOC.client)
  const emitter = new DataSinkWorkerEmitter(sqsClient, log)
  await emitter.init()

  const store = ioc.get<DbStore>(DATABASE_IOC.store)

  const dataSinkRepo = new DataSinkRepository(store, log)
  const memberRepo = new MemberRepository(store, log)

  const segmentIds = await dataSinkRepo.getSegmentIds(tenantId)
  const segmentId = segmentIds[segmentIds.length - 1] // leaf segment id

  const nodejsWorkerEmitter = ioc.get<NodejsWorkerEmitter>(SQS_IOC.emitters.nodejsWorker)

  const searchSyncWorkerEmitter = ioc.get<SearchSyncWorkerEmitter>(
    SQS_IOC.emitters.searchSyncWorker,
  )

  const memberService = new MemberService(store, nodejsWorkerEmitter, searchSyncWorkerEmitter, log)
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
              await searchSyncWorkerEmitter.triggerOrganizationSync(tenantId, org.id)
            }

            await searchSyncWorkerEmitter.triggerMemberSync(tenantId, member.id)
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
