import { DB_CONFIG, SQS_CONFIG } from '../conf'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import {
  DataSinkWorkerEmitter,
  NodejsWorkerEmitter,
  SearchSyncWorkerEmitter,
  getSqsClient,
} from '@crowd/sqs'
import MemberRepository from '../repo/member.repo'
import DataSinkRepository from '../repo/dataSink.repo'
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
  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new DataSinkWorkerEmitter(sqsClient, log)
  await emitter.init()

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const dataSinkRepo = new DataSinkRepository(store, log)
  const memberRepo = new MemberRepository(store, log)

  const segmentIds = await dataSinkRepo.getSegmentIds(tenantId)
  const segmentId = segmentIds[segmentIds.length - 1] // leaf segment id

  const nodejsWorkerEmitter = new NodejsWorkerEmitter(sqsClient, log)
  await nodejsWorkerEmitter.init()

  const searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(sqsClient, log)
  await searchSyncWorkerEmitter.init()

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
