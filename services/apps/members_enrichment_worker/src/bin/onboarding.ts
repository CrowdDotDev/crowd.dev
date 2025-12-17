import { timeout } from '@crowd/common'
import { MemberEnrichmentSource } from '@crowd/types'

import { svc } from '../service'
import { processMemberSources } from '../workflows/processMemberSources'

export * from '@temporalio/client'

// we don't need any of these to be running like if we would run this as an actual temporal worker
// we just need pg connection, redis & service logger
process.env['CROWD_TEMPORAL_TASKQUEUE'] = 'members-enrichment'
svc.config.envvars = []
svc.config.producer = { enabled: false }
svc.config.redis = { enabled: true }
svc.config.temporal = { enabled: true }
svc.options.opensearch = { enabled: false }

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  process.exit(1)
}

// TODO maybe add segmentId as parameter here as well
const tenantId = processArguments[0]

const minMemberActivities = 100
const maxConcurrentProcessing = 5
const maxMembersToProcess = Infinity

async function getEnrichableMembers(limit: number): Promise<string[]> {
  const query = `
  -- only use members that have more than one enrichment source
  with members_with_sources as (select distinct "memberId", count(*)
                                from "memberEnrichmentCache"
                                where data is not null
                                group by "memberId"
                                having count(*) > 1),
      -- also only use members that have more than 100 activities
      members_with_activities as (select distinct msa."memberId", sum("activityCount") as total_activities
                                  from members_with_sources ms
                                            inner join "memberSegmentsAgg" msa on msa."memberId" = ms."memberId"
                                            -- only consider subprojects otherwise we count some activities multiple times
                                            inner join segments s on s.id = msa."segmentId" and s."tenantId" = $(tenantId) and s.type = 'subproject'
                                  group by msa."memberId"
                                  having sum("activityCount") > $(minMemberActivities))
  select m.id
  from members m
          inner join members_with_activities ma on m.id = ma."memberId"
          left join "memberEnrichments" me on m.id = me."memberId"
  where m."deletedAt" is null and m."tenantId" = $(tenantId) and
        coalesce((m.attributes ->'isBot'->>'default')::boolean, false) = false and
        (me."memberId" is null or me."lastTriedAt" < now() - interval '3 months')
  order by ma.total_activities desc, m.id
  limit $(limit)
  `

  return (
    await svc.postgres.writer.connection().any(query, { limit, tenantId, minMemberActivities })
  ).map((row) => row.id)
}

const sources = Object.values(MemberEnrichmentSource) as MemberEnrichmentSource[]

setImmediate(async () => {
  await svc.init(false)

  let processingCount = 0
  let updatedMembersCount = 0
  let skippedMembersCount = 0
  let failedMembersCount = 0

  let totalProcessingTime = 0
  const REPORT_INTERVAL = 10

  const pageSize = 20
  let members = await getEnrichableMembers(pageSize)
  let pagePromises: Promise<void>[] = []
  while (members.length > 0) {
    svc.log.info({ memberCount: members.length }, 'Processing members!')
    // process members just like in enrichMember workflow
    for (const memberId of members) {
      if (updatedMembersCount >= maxMembersToProcess) {
        svc.log.info(
          { updatedMembersCount, maxMembersToProcess },
          'We reached a limit of how many members to process!',
        )
        break
      }

      while (processingCount >= maxConcurrentProcessing) {
        await timeout(100)
      }

      processingCount++
      const startTime = Date.now()

      const promise = startProcessMemberSource(memberId, sources)
        .then((res) => {
          processingCount--
          if (res) {
            const processingTime = Date.now() - startTime
            totalProcessingTime += processingTime

            updatedMembersCount++
          } else {
            skippedMembersCount++
          }

          // Report average processing time every REPORT_INTERVAL members
          if (updatedMembersCount > 0 && updatedMembersCount % REPORT_INTERVAL === 0) {
            const averageProcessingTime = totalProcessingTime / updatedMembersCount
            svc.log.info(
              {
                averageProcessingTime: `${(averageProcessingTime / 1000).toFixed(2)}s`,
                updatedMembers: updatedMembersCount,
                skippedMembers: skippedMembersCount,
                failedMembers: failedMembersCount,
              },
              'Processing time statistics',
            )
          }
        })
        .catch((err) => {
          processingCount--
          svc.log.error(err, { memberId }, 'Error while processing member enrichment sources!')
          failedMembersCount++
        })
      pagePromises.push(promise)
    }

    await Promise.all(pagePromises)
    pagePromises = []

    if (updatedMembersCount >= maxMembersToProcess) {
      members = []
    } else {
      // load next page
      members = await getEnrichableMembers(pageSize)
    }

    svc.log.info(
      {
        updatedMembersCount,
        skippedMembersCount,
        failedMembersCount,
        averageProcessingTime: `${(totalProcessingTime / updatedMembersCount / 1000).toFixed(2)}s`,
      },
      'Current statistics!',
    )
  }

  svc.log.info(
    {
      updatedMembersCount,
      skippedMembersCount,
      failedMembersCount,
      averageProcessingTime: `${(totalProcessingTime / updatedMembersCount / 1000).toFixed(2)}s`,
      totalProcessingTime: `${(totalProcessingTime / 1000).toFixed(2)}s`,
    },
    'Final statistics!',
  )

  process.exit(0)
})

async function startProcessMemberSource(
  memberId: string,
  sources: MemberEnrichmentSource[],
): Promise<boolean> {
  const updated = await svc.temporal.workflow.execute(processMemberSources, {
    taskQueue: 'members-enrichment',
    workflowId:
      'member-enrichment/875c38bd-2b1b-4e91-ad07-0cfbabb4c49f/' +
      memberId +
      '/processMemberSources',
    workflowExecutionTimeout: '15 minutes',
    retry: {
      backoffCoefficient: 2,
      maximumAttempts: 10,
      initialInterval: 2 * 1000,
      maximumInterval: 30 * 1000,
    },
    args: [
      {
        memberId,
        sources,
      },
    ],
    searchAttributes: {
      TenantId: ['875c38bd-2b1b-4e91-ad07-0cfbabb4c49f'],
    },
  })

  return updated
}
