import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IndexedEntityType } from '@crowd/opensearch/src/repo/indexing.data'
import { IMember } from '@crowd/types'

import { IFindMemberIdentitiesGroupedByPlatformResult, ISimilarMember } from './types'

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
                          FROM activities a
                          WHERE a."memberId" = m.id)
          AND NOT EXISTS (SELECT 1
                          FROM "memberOrganizations" mo
                          WHERE mo."memberId" = m.id)
          AND NOT EXISTS (SELECT 1
                          FROM "memberIdentities" mi
                          WHERE mi."memberId" = m.id)
          AND NOT EXISTS (SELECT 1
                          FROM "cleanupExcludeList" cel
                          WHERE cel."entityId" = m.id
                            AND cel."type" = 'member')
        limit $(batchSize);
      `,
      {
        batchSize,
      },
    )

    return results.map((r) => r.memberId)
  }

  public async deleteMember(memberId: string): Promise<void> {
    await this.connection.tx(async (tx) => {
      await tx.none(
        `
        DELETE FROM "memberEnrichmentCache"
        WHERE "memberId" = $(memberId)
      `,
        {
          memberId,
        },
      )

      await tx.none(
        `
        DELETE FROM "memberEnrichments"
        WHERE "memberId" = $(memberId)
      `,
        {
          memberId,
        },
      )

      await tx.none(
        `
        DELETE FROM "memberNoMerge"
        WHERE "memberId" = $(memberId) OR "noMergeId" = $(memberId)
      `,
        {
          memberId,
        },
      )

      await tx.none(
        `
        DELETE FROM "memberSegmentAffiliations"
        WHERE "memberId" = $(memberId)
      `,
        {
          memberId,
        },
      )

      await tx.none(
        `
        DELETE FROM "memberSegments"
        WHERE "memberId" = $(memberId)
        `,
        {
          memberId,
        },
      )

      await tx.none(
        `
        DELETE FROM "memberTags"
        WHERE "memberId" = $(memberId)
      `,
        {
          memberId,
        },
      )

      await tx.none(
        `
        DELETE FROM "memberToMerge"
        WHERE "memberId" = $(memberId) OR "toMergeId" = $(memberId)
      `,
        {
          memberId,
        },
      )

      await tx.none(
        `
        DELETE FROM "memberToMergeRaw"
        WHERE "memberId" = $(memberId) OR "toMergeId" = $(memberId)
      `,
        {
          memberId,
        },
      )

      await tx.none(
        `
        DELETE FROM "members"
        WHERE id = $(memberId)
      `,
        {
          memberId,
        },
      )
    })
  }

  public async getMembersWithDeletedOrgAffilations(
    limit: number,
  ): Promise<{ memberId: string; organizationId: string }[]> {
    // Finds activities where:
    // 1. Member had a work experience (now deleted)
    // 2. Member has NO active work experience at same org
    // 3. Member-Org pair hasn't been processed yet
    const query = `
      SELECT DISTINCT a."memberId", a."organizationId"
      FROM activities a
      INNER JOIN "memberOrganizations" mo_del
          ON mo_del."memberId" = a."memberId"
          AND mo_del."organizationId" = a."organizationId"
          AND mo_del."deletedAt" IS NOT NULL
      LEFT JOIN "memberOrganizations" mo_active
          ON mo_active."memberId" = a."memberId"
          AND mo_active."organizationId" = a."organizationId"
          AND mo_active."deletedAt" IS NULL
      LEFT JOIN "processedMemberOrgAffiliations" p
          ON p."memberId" = a."memberId"
          AND p."organizationId" = a."organizationId"
      WHERE
          a."organizationId" IS NOT NULL
          AND mo_active."memberId" IS NULL
          AND p."memberId" IS NULL
      LIMIT $(limit);
    `

    const results = await this.connection.any(query, {
      limit,
    })

    return results
  }
}

export default MemberRepository
