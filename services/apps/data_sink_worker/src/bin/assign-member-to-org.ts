import { DB_CONFIG, SQS_CONFIG } from '@/conf'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import {
  DataSinkWorkerEmitter,
  NodejsWorkerEmitter,
  SearchSyncWorkerEmitter,
  getSqsClient,
} from '@crowd/sqs'
import MemberRepository from '@/repo/member.repo'
import DataSinkRepository from '@/repo/dataSink.repo'
import MemberService from '@/service/member.service'
import { OrganizationService } from '@/service/organization.service'

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

  const result = await dataSinkRepo.getSegmentIds(tenantId)
  const segmentId = result[0] // parent segment id

  const nodejsWorkerEmitter = new NodejsWorkerEmitter(sqsClient, log)
  const searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(sqsClient, log)

  const memberService = new MemberService(store, nodejsWorkerEmitter, searchSyncWorkerEmitter, log)
  const orgService = new OrganizationService(store, log)

  const limit = 100
  let offset = 0
  let totalMembers = 0
  let processedMembers = 0

  try {
    do {
      const { members, totalCount } = await memberRepo.getMembersWithIdAndEmails(
        tenantId,
        segmentId,
        {
          limit,
          offset,
        },
      )

      totalMembers = totalCount
      log.info({ tenantId }, `Total members found in the tenant: ${totalMembers}`)

      // member -> organization based on email domain
      for (const member of members) {
        if (member.emails) {
          const orgs = await memberService.assignOrganizationByEmailDomain(
            tenantId,
            segmentId,
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
        log.info(`Processed member ${member.id}. Progress: ${processedMembers}/${totalMembers}`)
      }
      offset += limit
    } while (totalMembers > offset)

    log.info(`Member to organization association completed for the tenant ${tenantId}`)
  } catch (err) {
    log.error(`Failed to assign member to organizations for the tenant ${tenantId}`, err)
    process.exit(1)
  }
})
