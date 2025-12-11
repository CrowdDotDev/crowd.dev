import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IndexedEntityType } from '@crowd/opensearch/src/repo/indexing.data'
import { IMember } from '@crowd/types'

import { IDbActivityRelation } from '../../../activityRelations/types'

import {
  IDuplicateMembersToCleanup,
  IFindMemberIdentitiesGroupedByPlatformResult,
  ISimilarMember,
} from './types'

class MemberRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
  ) {}

  async findMembersWithSameVerifiedEmailsInDifferentPlatforms(
    limit = 50,
    afterHash: number = undefined,
  ): Promise<ISimilarMember[]> {
    let rows: ISimilarMember[] = []
    try {
      const afterHashFilter = afterHash
        ? ` and Greatest(Hashtext(Concat(a."memberId", b."memberId")), Hashtext(Concat(b."memberId", a."memberId"))) < $(afterHash) `
        : ''
      rows = await this.connection.query(
        `
    select 
        max(a."memberId"::text) as "primaryMemberId",
        min(b."memberId"::text) as "secondaryMemberId",
        max(a.value) as "primaryMemberIdentityValue",
        min(a.value) as "secondaryMemberIdentityValue",
        Greatest(Hashtext(Concat(a."memberId", b."memberId")), Hashtext(Concat(b."memberId", a."memberId"))) as hash
    from "memberIdentities" a
    join "memberIdentities" b on
        lower(a.value) = lower(b.value)
        and a."memberId" != b."memberId"
        and a.verified and b.verified
        and a.type = 'email'
        ${afterHashFilter}
    group by hash
    order by hash desc
    limit $(limit);
      `,
        {
          afterHash,
          limit,
        },
      )
    } catch (err) {
      this.log.error('Error while finding members!', err)

      throw new Error(err)
    }

    return rows
  }

  async findMembersWithSameGithubIdentitiesDifferentCapitalization(
    platform: string,
    limit = 50,
    afterHash: number = undefined,
  ): Promise<ISimilarMember[]> {
    let rows: ISimilarMember[] = []
    try {
      const afterHashFilter = afterHash
        ? ` and Greatest(Hashtext(Concat(a."memberId", b."memberId")), Hashtext(Concat(b."memberId", a."memberId"))) < $(afterHash) `
        : ''
      rows = await this.connection.query(
        `
    select 
        max(a."memberId"::text) as "primaryMemberId",
        min(b."memberId"::text) as "secondaryMemberId",
        max(a.value) as "primaryMemberIdentityValue",
        min(a.value) as "secondaryMemberIdentityValue",
        Greatest(Hashtext(Concat(a."memberId", b."memberId")), Hashtext(Concat(b."memberId", a."memberId"))) as hash
    from "memberIdentities" a
    join "memberIdentities" b on
        lower(a.value) = lower(b.value)
        and a.platform = b.platform
        and a."memberId" != b."memberId"
        and a.verified and b.verified
        and a.type = 'username'
        and a.platform = $(platform)
        ${afterHashFilter}
    where a."memberId" not in ('5c1a19a0-f85f-11ee-9aad-07d434aa9110', 'c14aec30-e84e-11ee-a714-e30d1595b2e7') and
          b."memberId" not in ('5c1a19a0-f85f-11ee-9aad-07d434aa9110', 'c14aec30-e84e-11ee-a714-e30d1595b2e7')
    group by hash
    order by hash desc
    limit $(limit);
      `,
        {
          platform,
          afterHash,
          limit,
        },
      )
    } catch (err) {
      this.log.error('Error while finding members!', err)

      throw new Error(err)
    }

    return rows
  }

  async findMemberIdentitiesGroupedByPlatform(
    memberId: string,
  ): Promise<IFindMemberIdentitiesGroupedByPlatformResult[]> {
    let rows: IFindMemberIdentitiesGroupedByPlatformResult[] = []
    try {
      rows = await this.connection.query(
        `
        select 
          array_agg(mi.platform) as platforms, 
          array_agg(mi.type) as types,
          array_agg(mi.verified) as verified,
          array_agg(mi.value) as values,
          lower(mi.value) as "groupedByValue"
        from "memberIdentities" mi
        where mi."memberId" = $(memberId)
        group by lower(mi.value);
      `,
        {
          memberId,
        },
      )
    } catch (err) {
      this.log.error('Error while finding similar identities in a member!', err)

      throw new Error(err)
    }

    return rows
  }

  async findMemberById(memberId: string): Promise<IMember | null> {
    let member: IMember

    try {
      member = await this.connection.oneOrNone(
        `
        select * from "members" where id = $(memberId)
      `,
        {
          memberId,
        },
      )
    } catch (err) {
      this.log.error('Error while finding member!', err)

      throw new Error(err)
    }

    return member
  }

  public async getMembersNotInSegmentAggs(perPage: number): Promise<string[]> {
    const results = await this.connection.any(
      `
      select distinct a."memberId"
      from activities a
      left join "memberSegmentsAgg" msa
        on a."memberId" = msa."memberId"
        and a."segmentId" = msa."segmentId"
      where msa."memberId" is null
        and msa."segmentId" is null
      limit ${perPage};
      `,
      {
        type: IndexedEntityType.MEMBER,
      },
    )

    return results.map((r) => r.id)
  }

  public async getMembersForCleanup(batchSize: number): Promise<string[]> {
    const results = await this.connection.query(
      `
        SELECT m.id as "memberId"
        FROM members m
        WHERE NOT EXISTS (SELECT 1
                          FROM "memberIdentities" mi
                          WHERE mi."memberId" = m.id)
          AND NOT EXISTS (SELECT 1
                          FROM "activityRelations" a
                          WHERE a."memberId" = m.id)
          AND m."manuallyCreated" != true
        LIMIT $(batchSize);
      `,
      {
        batchSize,
      },
    )

    return results.map((r) => r.memberId)
  }

  public async deleteMember(memberId: string): Promise<void> {
    const tablesToDelete = [
      { name: 'memberEnrichmentCache', conditions: ['memberId'] },
      { name: 'memberEnrichments', conditions: ['memberId'] },
      { name: 'memberNoMerge', conditions: ['memberId', 'noMergeId'] },
      { name: 'memberOrganizationAffiliationOverrides', conditions: ['memberId'] },
      { name: 'memberOrganizations', conditions: ['memberId'] },
      { name: 'memberSegmentAffiliations', conditions: ['memberId'] },
      { name: 'memberSegmentsAgg', conditions: ['memberId'] },
      { name: 'memberSegments', conditions: ['memberId'] },
      { name: 'memberToMerge', conditions: ['memberId', 'toMergeId'] },
      { name: 'memberToMergeRaw', conditions: ['memberId', 'toMergeId'] },
      { name: 'members', conditions: ['id'] },
    ]

    await this.connection.tx(async (tx) => {
      for (const table of tablesToDelete) {
        const whereClause = table.conditions.map((field) => `"${field}" = $(memberId)`).join(' OR ')
        await tx.none(`DELETE FROM "${table.name}" WHERE ${whereClause}`, { memberId })
      }
    })
  }

  public async findDuplicateMembersAfterDate(
    cutoffDate: string,
    limit: number,
    checkByActivityIdentity = false,
    checkByTwitterIdentity = false,
  ): Promise<IDuplicateMembersToCleanup[]> {
    /**
     * This query finds pairs of members that have the same Twitter identity where:
     * - The secondary member only has a Twitter identity and no other identities
     * - The primary member has multiple identities (Twitter + others)
     * - The secondary member has activity relations
     * Returns primaryId and secondaryId pairs ordered by primary ID
     */
    if (checkByTwitterIdentity) {
      return this.connection.query(
        `
          SELECT DISTINCT
              m_primary.id AS "primaryId",
              m_secondary.id AS "secondaryId"
          FROM members m_secondary
          JOIN "memberIdentities" mi_secondary ON mi_secondary."memberId" = m_secondary.id
          JOIN "memberIdentities" mi_primary ON 
              mi_primary.platform = 'twitter' AND
              mi_primary."value" = mi_secondary."value" AND
              mi_primary."memberId" != mi_secondary."memberId"
          JOIN members m_primary ON m_primary.id = mi_primary."memberId"
          WHERE mi_secondary.platform = 'twitter'
              AND (
                  SELECT COUNT(*) 
                  FROM "memberIdentities" mi 
                  WHERE mi."memberId" = m_secondary.id
              ) = 1
              AND (
                  SELECT COUNT(*) 
                  FROM "memberIdentities" mi 
                  WHERE mi."memberId" = m_primary.id
              ) > 1
              AND EXISTS (
                  SELECT 1 
                  FROM "activityRelations" ar 
                  WHERE ar."memberId" = m_secondary.id
              )
          ORDER BY m_primary.id, m_secondary.id
          LIMIT $(limit);
        `,
        {
          limit,
        },
      )
    }

    /**
     * This query finds pairs of members where:
     * - The secondary member has no identities but has activity relations
     * - The secondary member was created after the cutoff date
     * - The primary member has a verified identity matching the username and platform
     *   of one of the secondary member's activities
     * Returns primaryId and secondaryId pairs ordered by primary ID and limited by input limit
     */
    if (checkByActivityIdentity) {
      return this.connection.query(
        `
      WITH secondary_candidates AS (
        SELECT m.id AS secondary_id
        FROM members m
        where m."createdAt" > $(cutoffDate)
          AND NOT EXISTS (
              SELECT 1 FROM "memberIdentities" mi 
              WHERE mi."memberId" = m.id
          )
          AND EXISTS (
              SELECT 1 FROM "activityRelations" ar 
              WHERE ar."memberId" = m.id
          )
      ),
      matches AS (
        SELECT
          mi."memberId" AS primary_id,
          sc.secondary_id
        FROM secondary_candidates sc
        JOIN "activityRelations" ar
          ON ar."memberId" = sc.secondary_id
        JOIN "memberIdentities" mi
          ON mi.value = ar.username
          AND mi.platform = ar.platform
          AND mi.verified = TRUE
          AND mi."memberId" != sc.secondary_id
      )
      SELECT DISTINCT primary_id as "primaryId", secondary_id as "secondaryId"
      FROM matches
      ORDER BY primary_id, secondary_id
      LIMIT $(limit);
      `,
        {
          cutoffDate,
          limit,
        },
      )
    }

    /**
     * This query finds pairs of members where:
     * - The secondary member has no identities but has activity relations
     * - The secondary member was created after the cutoff date
     * - The primary member has at least one identity
     * - The primary and secondary members have matching display names
     * Returns primaryId and secondaryId pairs ordered by primary ID and limited by input limit
     */
    return this.connection.query(
      `
      WITH valid_primary AS (
        SELECT DISTINCT m.id, m."displayName"
        FROM members m
        JOIN "memberIdentities" mi ON mi."memberId" = m.id
      )
      SELECT DISTINCT
        m_primary.id AS "primaryId",
        m_secondary.id AS "secondaryId"
      FROM members m_secondary
      JOIN valid_primary m_primary
        ON m_primary."displayName" = m_secondary."displayName"
        AND m_primary.id != m_secondary.id
      WHERE m_secondary."createdAt" > $(cutoffDate)
          AND NOT EXISTS (
            SELECT 1 FROM "memberIdentities" mi
            WHERE mi."memberId" = m_secondary.id
          )
          AND EXISTS (
            SELECT 1 FROM "activityRelations" ar
            WHERE ar."memberId" = m_secondary.id
          )
      ORDER BY m_primary.id, m_secondary.id
      LIMIT $(limit);
    `,
      {
        cutoffDate,
        limit,
      },
    )
  }

  public async getBotMembersWithOrgAffiliation(batchSize: number): Promise<string[]> {
    const results = await this.connection.query(
      `
      SELECT 
        m.id as "memberId"
      FROM members m
      WHERE m.attributes->'isBot'->>'default' = 'true'
        AND EXISTS (
          SELECT 1 FROM "activityRelations" ar 
          WHERE ar."memberId" = m.id and ar."organizationId" is not null
        )
      LIMIT $(batchSize);
      `,
      {
        batchSize,
      },
    )

    return results.map((r) => r.memberId)
  }

  public async findMembersWithIncorrectActivityRelations(
    batchSize: number,
  ): Promise<Partial<IDbActivityRelation>[]> {
    return this.connection.query(
      `
      SELECT ar."memberId", ar."username", ar."platform"
      FROM "activityRelations" ar
      WHERE EXISTS (
          SELECT 1
          FROM "memberIdentities" mi
          WHERE mi.platform = ar.platform
            AND mi.value = ar.username
            AND mi.type = 'username'
            AND mi.verified = true
            AND ar."memberId" != mi."memberId"
      )
      LIMIT $(batchSize);
      `,
      { batchSize },
    )
  }

  public async getMemberIdByUsernameAndPlatform(
    username: string,
    platform: string,
  ): Promise<string> {
    const result = await this.connection.oneOrNone(
      `
      SELECT "memberId" as "memberId"
      FROM "memberIdentities"
      WHERE value = $(username)
        AND platform = $(platform)
        AND verified = TRUE
        AND type = 'username'
      `,
      { username, platform },
    )

    if (!result) {
      throw new Error(`No verified member found!`)
    }

    return result.memberId
  }
}

export default MemberRepository
