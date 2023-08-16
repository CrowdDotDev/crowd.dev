import { DbStore } from '@crowd/database'
import { Logger, LoggerBase } from '@crowd/logging'
import MemberAffiliationRepository from '../repo/memberAffiliation.repo'

export default class MemberAffiliationService extends LoggerBase {
  private readonly repo: MemberAffiliationRepository

  constructor(private readonly store: DbStore, parentLog: Logger) {
    super(parentLog)

    this.repo = new MemberAffiliationRepository(store, this.log)
  }

  public async findAffiliation(
    memberId: string,
    segmentId: string,
    timestamp: string,
  ): Promise<string | null> {
    const manualAffiliation = await this.repo.findManualAffiliation(memberId, segmentId, timestamp)
    if (manualAffiliation) {
      return manualAffiliation.organizationId
    }

    const currentEmployment = await this.repo.findWorkExperience(memberId, timestamp)
    if (currentEmployment) {
      return currentEmployment.organizationId
    }

    const mostRecentOrg = await this.repo.findMostRecentOrganization(memberId, timestamp)
    if (mostRecentOrg) {
      return mostRecentOrg.organizationId
    }

    return null
  }
}
