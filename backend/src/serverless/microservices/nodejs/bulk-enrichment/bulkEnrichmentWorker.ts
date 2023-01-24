import getUserContext from '../../../../database/utils/getUserContext'
import MemberEnrichmentService from '../../../../services/premium/enrichment/memberEnrichmentService'

/**
 * Sends weekly analytics emails of a given tenant
 * to all users of the tenant.
 * Data sent is for the last week.
 * @param tenantId
 */
async function bulkEnrichmentWorker(tenantId: string, memberIds: string[]) {
  const userContext = await getUserContext(tenantId)
  const memberEnrichmentService = new MemberEnrichmentService(userContext)
  await memberEnrichmentService.bulkEnrich(memberIds)
}
export { bulkEnrichmentWorker }
