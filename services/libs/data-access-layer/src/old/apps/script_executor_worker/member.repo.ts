import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IndexedEntityType } from '@crowd/opensearch/src/repo/indexing.data'
import { IMember } from '@crowd/types'

import {
  IDuplicateMembersToMerge,
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
          AND NOT EXISTS (SELECT 1
                          FROM "memberOrganizations" mo
                          WHERE mo."memberId" = m.id)
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
      { name: 'memberSegmentAffiliations', conditions: ['memberId'] },
      { name: 'memberSegmentsAgg', conditions: ['memberId'] },
      { name: 'memberSegments', conditions: ['memberId'] },
      { name: 'memberTags', conditions: ['memberId'] },
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
  ): Promise<IDuplicateMembersToMerge[]> {
    return this.connection.query(
      `
        SELECT DISTINCT ON (m_secondary.id)
            m_primary.id as "primaryId",
            m_secondary.id as "secondaryId"
        FROM members m_secondary
        LEFT JOIN "memberIdentities" mi_secondary ON mi_secondary."memberId" = m_secondary.id
        JOIN members m_primary ON m_primary."displayName" = m_secondary."displayName" 
            AND m_primary.id != m_secondary.id
        JOIN "memberIdentities" mi_primary ON mi_primary."memberId" = m_primary.id
        LEFT JOIN "mergeActions" ma ON ma."primaryId" = m_primary.id 
            AND ma."secondaryId" = m_secondary.id 
            AND ma.type = 'member'
            AND ma.step = 'merge-done'
        WHERE m_secondary."createdAt" > $(cutoffDate)
            AND mi_secondary."memberId" IS NULL
            AND ma.id IS NULL
        LIMIT $(limit)
      `,
      {
        cutoffDate,
        limit,
      },
    )
  }
}

export default MemberRepository
