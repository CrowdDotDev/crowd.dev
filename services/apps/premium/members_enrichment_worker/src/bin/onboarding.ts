import { MemberEnrichmentSource } from '@crowd/types'

import { processMemberSources } from '../activities/enrichment'
import { svc } from '../service'

// we don't need any of these to be running like if we would run this as an actual temporal worker
// we just need pg connection, redis & service logger
process.env['CROWD_TEMPORAL_TASKQUEUE'] = 'not-important'
svc.config.envvars = []
svc.config.producer = { enabled: false }
svc.config.redis = { enabled: true }
svc.config.temporal = { enabled: false }
svc.config.questdb = { enabled: false }
svc.options.opensearch = { enabled: false }

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  process.exit(1)
}

const tenantId = processArguments[0]

async function getEnrichableMembers(limit: number, lastMemberId?: string): Promise<string[]> {
  const query = `
  -- only use members that have more than one enrichment source
  with members_with_sources as (select distinct "memberId", count(*)
                                from "memberEnrichmentCache"
                                group by "memberId"
                                having count(*) > 1),
      -- also only use members that have more than 10 activities
      members_with_activities as (select distinct msa."memberId", sum("activityCount") as total_activities
                                  from members_with_sources ms
                                            inner join "memberSegmentsAgg" msa on msa."memberId" = ms."memberId"
                                            -- only consider subprojects otherwise we count some activities multiple times
                                            inner join segments s on s.id = msa."segmentId" and s."tenantId" = $(tenantId) and s.type = 'subproject'
                                  group by msa."memberId"
                                  having sum("activityCount") > 100)
  select m.id
  from members m
          inner join members_with_activities ma on m.id = ma."memberId"
  where m."deletedAt" is null and m."tenantId" = $(tenantId)
  ${lastMemberId ? `and m.id > $(lastMemberId)` : ''}
    and (m."lastEnriched" is null
      or m."lastEnriched" < now() - interval '3 months')
  order by ma.total_activities desc, m.id
  limit $(limit)
  `

  return (await svc.postgres.writer.connection().any(query, { lastMemberId, limit, tenantId })).map(
    (row) => row.id,
  )
}

const sources = Object.values(MemberEnrichmentSource) as MemberEnrichmentSource[]

setImmediate(async () => {
  await svc.init(false)

  const pageSize = 100
  let members = await getEnrichableMembers(pageSize)
  // let members = ['8db6c61e-f8b0-400e-ac5d-cb550d8740c9']
  while (members.length > 0) {
    svc.log.info({ memberCount: members.length }, 'Processing members!')
    // process members just like in enrichMember workflow
    for (const memberId of members) {
      await processMemberSources(memberId, sources)
    }

    // load next page
    // members = await getEnrichableMembers(pageSize, members[members.length - 1])
    members = []
  }

  process.exit(0)
})
