import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import {
  DataSinkWorkerEmitter,
  NodejsWorkerEmitter,
  SearchSyncWorkerEmitter,
  getSqsClient,
} from '@crowd/sqs'
import { SQS_CONFIG, DB_CONFIG } from '../conf'
import DataSinkRepository from '../repo/dataSink.repo'
import MemberRepository from '../repo/member.repo'
import MemberService from '../service/member.service'
import { OrganizationService } from '../service/organization.service'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: memberId')
  process.exit(1)
}

const memberId = processArguments[0]

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new DataSinkWorkerEmitter(sqsClient, log)
  await emitter.init()

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const dataSinkRepo = new DataSinkRepository(store, log)
  const memberRepo = new MemberRepository(store, log)

  const nodejsWorkerEmitter = new NodejsWorkerEmitter(sqsClient, log)
  await nodejsWorkerEmitter.init()

  const searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(sqsClient, log)
  await searchSyncWorkerEmitter.init()

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
