import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IDbMemberSyncData, IDbSegmentInfo } from './member.data'
import { IMemberAttribute } from '@crowd/types'
import { RedisCache, RedisClient } from '@crowd/redis'

export class MemberRepository extends RepositoryBase<MemberRepository> {
  private readonly cache: RedisCache

  constructor(redisClient: RedisClient, dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)

    this.cache = new RedisCache('memberAttributes', redisClient, this.log)
  }

  public async getParentSegmentIds(childSegmentIds: string[]): Promise<IDbSegmentInfo[]> {
    const results = await this.db().any(
      `
      select s.id, pd.id as "parentId", gpd.id as "grandParentId"
      from segments s
              inner join segments pd
                          on pd."tenantId" = s."tenantId" and pd.slug = s."parentSlug" and pd."grandparentSlug" is null and
                            pd."parentSlug" is not null
              inner join segments gpd on gpd."tenantId" = s."tenantId" and gpd.slug = s."grandparentSlug" and
                                          gpd."grandparentSlug" is null and gpd."parentSlug" is null
      where s.id in ($(childSegmentIds:csv));
      `,
      {
        childSegmentIds,
      },
    )
    return results
  }

  public async getUnsyncedTenantIds(): Promise<string[]> {
    const results = await this.db().any(
      `select distinct "tenantId" from members where "searchSyncedAt" is null;`,
    )

    return results.map((r) => r.tenantId)
  }

  public async getTenantMemberAttributes(tenantId: string): Promise<IMemberAttribute[]> {
    const cachedString = await this.cache.get(tenantId)

    if (cachedString) {
      return JSON.parse(cachedString)
    }

    const results = await this.db().any(
      `select type, "canDelete", show, label, name, options from "memberAttributeSettings" where "tenantId" = $(tenantId)`,
      {
        tenantId,
      },
    )

    await this.cache.set(tenantId, JSON.stringify(results))

    return results
  }

  public async getTenantMembersForSync(
    tenantId: string,
    page: number,
    perPage: number,
  ): Promise<string[]> {
    const results = await this.db().any(
      `
        select m.id
        from members m
        where m."tenantId" = $(tenantId) and m."deletedAt" is null and m."searchSyncedAt" is null
        and exists (select 1 from activities where "memberId" = m.id) and exists (select 1 from "memberIdentities" where "memberId" = m.id)
        limit ${perPage} offset ${(page - 1) * perPage};`,
      {
        tenantId,
      },
    )

    return results.map((r) => r.id)
  }

  public async getMemberData(ids: string[]): Promise<IDbMemberSyncData[]> {
    const results = await this.db().any(
      `
      with to_merge_data as (select mtm."memberId",
                                      array_agg(distinct mtm."toMergeId"::text) as to_merge_ids
                              from "memberToMerge" mtm
                                        inner join members m2 on mtm."toMergeId" = m2.id
                              where mtm."memberId" in ($(ids:csv))
                                and m2."deletedAt" is null
                              group by mtm."memberId"),
            no_merge_data as (select mnm."memberId",
                                      array_agg(distinct mnm."noMergeId"::text) as no_merge_ids
                              from "memberNoMerge" mnm
                                        inner join members m2 on mnm."noMergeId" = m2.id
                              where mnm."memberId" in ($(ids:csv))
                                and m2."deletedAt" is null
                              group by mnm."memberId"),
            member_tags as (select mt."memberId",
                                    json_agg(
                                            json_build_object(
                                                    'id', t.id,
                                                    'name', t.name
                                                )
                                        )           as all_tags,
                                    jsonb_agg(t.id) as all_ids
                            from "memberTags" mt
                                      inner join tags t on mt."tagId" = t.id
                            where mt."memberId" in ($(ids:csv))
                              and t."deletedAt" is null
                            group by mt."memberId"),
            member_organizations as (select mo."memberId",
                                            os."segmentId",
                                            json_agg(
                                                    json_build_object(
                                                            'id', o.id,
                                                            'logo', o.logo,
                                                            'displayName', o."displayName"
                                                        )
                                                )           as all_organizations,
                                            jsonb_agg(o.id) as all_ids
                                      from "memberOrganizations" mo
                                              inner join organizations o on mo."organizationId" = o.id
                                              inner join "organizationSegments" os on o.id = os."organizationId"
                                      where mo."memberId" in ($(ids:csv))
                                        and o."deletedAt" is null
                                      group by mo."memberId", os."segmentId"),
            identities as (select mi."memberId",
                                  json_agg(
                                          json_build_object(
                                                  'platform', mi.platform,
                                                  'username', mi.username
                                              )
                                      ) as identities
                            from "memberIdentities" mi
                            where mi."memberId" in ($(ids:csv))
                            group by mi."memberId"),
            activity_data as (select a."memberId",
                                      a."segmentId",
                                      count(a.id)                                                          as "activityCount",
                                      max(a.timestamp)                                                     as "lastActive",
                                      array_agg(distinct concat(a.platform, ':', a.type))
                                      filter (where a.platform is not null)                                as "activityTypes",
                                      array_agg(distinct a.platform) filter (where a.platform is not null) as "activeOn",
                                      count(distinct a."timestamp"::date)                                  as "activeDaysCount",
                                      round(avg(
                                                    case
                                                        when (a.sentiment ->> 'sentiment'::text) is not null
                                                            then (a.sentiment ->> 'sentiment'::text)::double precision
                                                        else null::double precision
                                                        end)::numeric, 2)                                  as "averageSentiment"
                              from activities a
                              where a."memberId" in ($(ids:csv))
                              group by a."memberId", a."segmentId")
        select m.id,
              m."tenantId",
              ms."segmentId",
              m."displayName",
              m.attributes,
              m.emails,
              m.score,
              m."lastEnriched",
              m."joinedAt",
              (m.reach -> 'total')::integer                      as "totalReach",
              coalesce(jsonb_array_length(m.contributions), 0)   as "numberOfOpenSourceContributions",

              ad."activeOn",
              ad."activityCount",
              ad."activityTypes",
              ad."activeDaysCount",
              ad."lastActive",
              ad."averageSentiment",

              i.identities,
              coalesce(mo.all_organizations, json_build_array()) as organizations,
              coalesce(mt.all_tags, json_build_array())          as tags,
              coalesce(tmd.to_merge_ids, array []::text[])       as "toMergeIds",
              coalesce(nmd.no_merge_ids, array []::text[])       as "noMergeIds"
        from "memberSegments" ms
                inner join members m on ms."memberId" = m.id
                inner join identities i on m.id = i."memberId"
                inner join activity_data ad on ms."memberId" = ad."memberId" and ms."segmentId" = ad."segmentId"
                left join to_merge_data tmd on m.id = tmd."memberId"
                left join no_merge_data nmd on m.id = nmd."memberId"
                left join member_tags mt on ms."memberId" = mt."memberId"
                left join member_organizations mo on ms."memberId" = mo."memberId" and ms."segmentId" = mo."segmentId"
        where ms."memberId" in ($(ids:csv))
          and m."deletedAt" is null;`,
      {
        ids,
      },
    )

    return results
  }

  public async setTenanMembersForSync(tenantId: string): Promise<void> {
    await this.db().none(
      `update members set "searchSyncedAt" = null where "tenantId" = $(tenantId)`,
      {
        tenantId,
      },
    )
  }

  public async markSynced(memberIds: string[]): Promise<void> {
    await this.db().none(
      `update members set "searchSyncedAt" = now() where id in ($(memberIds:csv))`,
      {
        memberIds,
      },
    )
  }

  public async checkMembersExists(tenantId: string, memberIds: string[]): Promise<string[]> {
    const results = await this.db().any(
      `
      select m.id
      from members m
      where m."tenantId" = $(tenantId ) and 
            m.id in ($(memberIds:csv)) and
            exists(select 1 from activities a where a."memberId" = m.id) and
            exists(select 1 from "memberIdentities" mi where mi."memberId" = m.id)
      `,
      {
        tenantId,
        memberIds,
      },
    )

    return results.map((r) => r.id)
  }
}
