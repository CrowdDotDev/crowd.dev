import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IManualAffiliationData, IWorkExperienceData } from './memberAffiliation.data'

export default class MemberAffiliationRepository extends RepositoryBase<MemberAffiliationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async findManualAffiliation(
    memberId: string,
    segmentId: string,
    timestamp: string,
  ): Promise<IManualAffiliationData | null> {
    const result = await this.db().oneOrNone(
      `
        SELECT * FROM "memberSegmentAffiliations"
        WHERE "memberId" = $(memberId)
          AND "segmentId" = $(segmentId)
          AND (
            ("dateStart" <= $(timestamp) AND "dateEnd" >= $(timestamp))
            OR ("dateStart" <= $(timestamp) AND "dateEnd" IS NULL)
          )
        ORDER BY "dateStart" DESC, id
        LIMIT 1
      `,
      {
        memberId,
        segmentId,
        timestamp,
      },
    )
    return result
  }

  public async findWorkExperience(
    memberId: string,
    timestamp: string,
  ): Promise<IWorkExperienceData | null> {
    const result = await this.db().oneOrNone(
      `
        SELECT * FROM "memberOrganizations"
        WHERE "memberId" = $(memberId)
          AND (
            ("dateStart" <= $(timestamp) AND "dateEnd" >= $(timestamp))
            OR ("dateStart" <= $(timestamp) AND "dateEnd" IS NULL)
          )
        ORDER BY "dateStart" DESC, id
        LIMIT 1
      `,
      {
        memberId,
        timestamp,
      },
    )

    return result
  }

  public async findMostRecentOrganization(
    memberId: string,
    timestamp: string,
  ): Promise<IWorkExperienceData | null> {
    const result = await this.db().oneOrNone(
      `
        SELECT * FROM "memberOrganizations"
        WHERE "memberId" = $(memberId)
          AND "createdAt" <= $(timestamp)
        ORDER BY "createdAt" DESC, id
        LIMIT 1
      `,
      {
        memberId,
        timestamp,
      },
    )

    return result
  }
}
