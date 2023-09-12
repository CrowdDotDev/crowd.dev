import { getServiceChildLogger } from '@crowd/logging'
import OrganizationRepository from '@/database/repositories/organizationRepository'
import getUserContext from '@/database/utils/getUserContext'
import OrganizationService from '@/services/organizationService'

const log = getServiceChildLogger('enrichMemberOrganizationsWorker')

export const enrichMemberOrganizations = async (
  tenantId: string,
  memberId: string,
  orgIds: string[],
): Promise<void> => {
  const context = await getUserContext(tenantId)
  const orgService = new OrganizationService(context)

  if (orgService.shouldEnrich(true)) {
    log.info({ memberId }, `Enriching ${orgIds.length} organizations!`)

    for (const orgId of orgIds) {
      log.info({ memberId, organizationId: orgId }, `Enriching organization!`)
      const organization = await OrganizationRepository.findById(orgId, context)
      await orgService.createOrUpdate(organization, true)
    }
  }
}
