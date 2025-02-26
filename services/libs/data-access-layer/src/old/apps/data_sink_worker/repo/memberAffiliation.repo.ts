import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'

import {
  IManualAffiliationData,
  IOrganizationMemberCount,
  IWorkExperienceData,
} from './memberAffiliation.data'

export default class MemberAffiliationRepository extends RepositoryBase<MemberAffiliationRepository> {
  private BLACKLISTED_TITLES = ['Investor', 'Mentor', 'Board Member']

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
  ): Promise<IWorkExperienceData[] | null> {
    const result = await this.db().manyOrNone(
      `
        SELECT
            mo.*,
            coalesce(ovr."isPrimaryWorkExperience", false) as "isPrimaryWorkExperience"
        FROM "memberOrganizations" mo
        LEFT JOIN "memberOrganizationAffiliationOverrides" ovr on ovr."memberOrganizationId" = mo."id"
        WHERE mo."memberId" = $(memberId)
          AND (
            (mo."dateStart" <= $(timestamp) AND mo."dateEnd" >= $(timestamp))
            OR (mo."dateStart" <= $(timestamp) AND mo."dateEnd" IS NULL)
          )
          AND mo."deletedAt" IS NULL
          AND coalesce(ovr."allowAffiliation", true) = true
        ORDER BY mo."dateStart" DESC, mo.id
      `,
      {
        memberId,
        timestamp,
      },
    )

    return this.filterOutBlacklistedTitles(result, this.BLACKLISTED_TITLES)
  }

  public async findMemberCountEstimateOfOrganizations(
    organizationIds: string[],
  ): Promise<IOrganizationMemberCount[] | null> {
    const result = await this.db().manyOrNone(
      `
        SELECT
          osa."organizationId",
          sum(osa."memberCount") AS "memberCount
      FROM "organizationSegmentsAgg" osa
      WHERE osa."segmentId" IN (
          SELECT id
          FROM segments
          WHERE "grandparentId" is not null
              AND "parentId" is not null
      )
      and osa."organizationId" IN ($(organizationIds:csv))
      group by osa."organizationId"
      order by total_count desc
      `,
      {
        organizationIds,
      },
    )

    return result
  }

  public async findMostRecentUnknownDatedOrganizations(
    memberId: string,
    timestamp: string,
  ): Promise<IWorkExperienceData[] | null> {
    const result = await this.db().manyOrNone(
      `
        SELECT
          mo.*,
          coalesce(ovr."isPrimaryWorkExperience", false) as "isPrimaryWorkExperience"
        FROM "memberOrganizations" mo
        LEFT JOIN "memberOrganizationAffiliationOverrides" ovr on ovr."memberOrganizationId" = mo.id
        WHERE mo."memberId" = $(memberId)
          AND mo."dateStart" IS NULL
          AND mo."dateEnd" IS NULL
          AND mo."createdAt" <= $(timestamp)
          AND mo."deletedAt" IS NULL
          AND coalesce(ovr."allowAffiliation", true) = true
        ORDER BY mo."createdAt" DESC, mo.id
      `,
      {
        memberId,
        timestamp,
      },
    )

    return this.filterOutBlacklistedTitles(result, this.BLACKLISTED_TITLES)
  }

  public async findAllUnkownDatedOrganizations(
    memberId: string,
  ): Promise<IWorkExperienceData[] | null> {
    const result = await this.db().manyOrNone(
      `
        SELECT
          mo.*,
          coalesce(ovr."isPrimaryWorkExperience", false) as "isPrimaryWorkExperience"
        FROM "memberOrganizations" mo
        LEFT JOIN "memberOrganizationAffiliationOverrides" ovr on ovr."memberOrganizationId" = mo.id
        WHERE mo."memberId" = $(memberId)
          AND mo."dateStart" IS NULL
          AND mo."dateEnd" IS NULL
          AND mo."deletedAt" IS NULL
          AND coalesce(ovr."allowAffiliation", true) = true
        ORDER BY mo."createdAt", mo.id
      `,
      {
        memberId,
      },
    )

    return this.filterOutBlacklistedTitles(result, this.BLACKLISTED_TITLES)
  }

  public filterOutBlacklistedTitles(
    experiences: IWorkExperienceData[],
    blacklistedTitles: string[],
  ): IWorkExperienceData[] {
    return experiences.filter(
      (row) =>
        !row.title ||
        (row.title !== null &&
          row.title !== undefined &&
          !blacklistedTitles.some((t) => row.title.toLowerCase().includes(t.toLowerCase()))),
    )
  }
}
