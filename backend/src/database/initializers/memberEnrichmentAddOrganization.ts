/**
 * This script is responsible for generating non
 * existing parentIds for historical discord activities
 */
import { QueryTypes } from 'sequelize'
import { getServiceChildLogger } from '@crowd/logging'
import TenantService from '../../services/tenantService'
import getUserContext from '../utils/getUserContext'
import MemberService from '../../services/memberService'
import MemberEnrichmentService from '../../services/premium/enrichment/memberEnrichmentService'

const log = getServiceChildLogger('fixer')

async function memberEnrichmentAddOrganization() {
  const tenants = await TenantService._findAndCountAllForEveryUser({})

  tenants.rows = tenants.rows.filter((i) => i.id === '1a634aad-ca86-4bad-9876-ab2e6ab880cc')

  // for each tenant
  for (const t of tenants.rows) {
    const tenantId = t.id
    // get user context
    const userContext = await getUserContext(tenantId)
    // get discord message activities
    const memberService = new MemberService(userContext)

    const memberEnrichmentService = new MemberEnrichmentService(userContext)

    // get enriched members
    const members = await userContext.database.sequelize.query(
      `select mc.data as "enrichmentData", m.id as id from members m
    join "memberEnrichmentCache" mc on mc."memberId" = m.id
    where m."tenantId" = :tenantId and m."lastEnriched" is not null;`,
      {
        replacements: {
          tenantId,
        },
        type: QueryTypes.SELECT,
      },
    )

    for (const member of members) {
      log.info(`Enriching member ${member.id} again!`)

      const memberById = await memberService.findById(member.id, true, false)
      log.info({ ed: member.enrichmentData }, `Enrichment data:`)

      await memberEnrichmentService.getAttributes()

      const normalizedData = await memberEnrichmentService.normalize(
        memberById,
        member.enrichmentData,
      )

      await memberService.upsert({
        ...normalizedData,
        platform: Object.keys(memberById.username)[0],
      })
    }
  }
}

memberEnrichmentAddOrganization()
