import { getLongestDateRange } from '@crowd/common'
import { DbStore } from '@crowd/data-access-layer/src/database'
import { IWorkExperienceData } from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/memberAffiliation.data'
import MemberAffiliationRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/memberAffiliation.repo'
import { Logger, LoggerBase } from '@crowd/logging'

export default class MemberAffiliationService extends LoggerBase {
  private readonly repo: MemberAffiliationRepository

  constructor(store: DbStore, parentLog: Logger) {
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

    const currentEmployments = await this.repo.findWorkExperience(memberId, timestamp)
    if (currentEmployments.length > 0) {
      return this.decidePrimaryOrganizationId(currentEmployments)
    }

    const mostRecentUnknownDatedOrgs = await this.repo.findMostRecentUnknownDatedOrganizations(
      memberId,
      timestamp,
    )
    if (mostRecentUnknownDatedOrgs.length > 0) {
      return this.decidePrimaryOrganizationId(mostRecentUnknownDatedOrgs)
    }

    const allUnkownDAtedOrgs = await this.repo.findAllUnkownDatedOrganizations(memberId)
    if (allUnkownDAtedOrgs.length > 0) {
      return this.decidePrimaryOrganizationId(allUnkownDAtedOrgs)
    }

    return null
  }

  public async decidePrimaryOrganizationId(
    experiences: IWorkExperienceData[],
  ): Promise<string | null> {
    if (experiences.length > 0) {
      if (experiences.length === 1) {
        return experiences[0].organizationId
      }

      // check if any of the employements are marked as primary
      const primaryEmployment = experiences.find((employment) => employment.isPrimaryOrganization)

      if (primaryEmployment) {
        return primaryEmployment.organizationId
      }

      // decide based on the member count in the organizations
      const memberCounts = await this.repo.findMemberCountEstimateOfOrganizations(
        experiences.map((e) => e.organizationId),
      )

      if (memberCounts[0].memberCount > memberCounts[1].memberCount) {
        return memberCounts[0].organizationId
      }

      // if there's a draw in the member count, use the one with the longer period
      return getLongestDateRange(experiences).organizationId
    }

    return null
  }
}
