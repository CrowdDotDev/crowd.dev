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

  public async getMembersWithDeletedOrgAffilations(
    limit: number,
  ): Promise<{ memberId: string; organizationId: string }[]> {
    // Finds activities where:
    // 1. Member had a work experience (now deleted)
    // 2. Member has NO active work experience at same org
    // 3. Member-Org pair hasn't been processed yet
    const query = `
      select distinct a."memberId", a."organizationId"
      from activities a
      left join "processedMemberOrgAffiliations" p on
        p."memberId" = a."memberId"
        and p."organizationId" = a."organizationId"
      where a."organizationId" is not null
      and p."memberId" is null
      and exists (
          select 1
          from "memberOrganizations" mo
          where mo."memberId" = a."memberId"
          and mo."organizationId" = a."organizationId"
          and mo."deletedAt" is not null
      )
      and not exists (
          select 1
          from "memberOrganizations" mo_active
          where mo_active."memberId" = a."memberId"
          and mo_active."organizationId" = a."organizationId"
          and mo_active."deletedAt" is null
      )
      limit $(limit);
    `

    const results = await this.connection.any(query, {
      limit,
    })

    return results
  }
}

export default MemberRepository
