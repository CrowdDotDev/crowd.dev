import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IMemberSyncData } from './member.data'

export class MemberRepository extends RepositoryBase<MemberRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async getTenantMembers(
    tenantId: string,
    page: number,
    perPage: number,
  ): Promise<IMemberSyncData[]> {
    const results = await this.db().any(
      `
      with to_merge_data as (select mtm."memberId",
                                array_agg(distinct mtm."toMergeId"::text) as to_merge_ids
                        from "memberToMerge" mtm
                                  inner join members m2 on mtm."toMergeId" = m2.id
                        where m2."tenantId" = $(tenantId)
                          and m2."deletedAt" is null
                        group by mtm."memberId"),
      no_merge_data as (select mnm."memberId",
                                array_agg(distinct mnm."noMergeId"::text) as no_merge_ids
                        from "memberNoMerge" mnm
                                  inner join members m2 on mnm."noMergeId" = m2.id
                        where m2."tenantId" = $(tenantId)
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
                                inner join members m on mt."memberId" = m.id
                                inner join tags t on mt."tagId" = t.id
                      where m."tenantId" = $(tenantId)
                        and t."deletedAt" is null
                      group by mt."memberId"),
      member_organizations as (select mo."memberId",
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
                                where o."tenantId" = $(tenantId)
                                  and o."deletedAt" is null
                                group by mo."memberId"),
      identities as (select mi."memberId",
                            json_agg(
                                    json_build_object(
                                            'platform', mi.platform,
                                            'username', mi.username
                                        )
                                ) as identities
                      from "memberIdentities" mi
                      where mi."tenantId" = $(tenantId)
                      group by mi."memberId"),
      activity_data as (select a."memberId",
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
                        where a."tenantId" = $(tenantId)
                        group by a."memberId")
      select m.id,
        m."tenantId",
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
      from members m
          inner join identities i on m.id = i."memberId"
          inner join activity_data ad on m.id = ad."memberId"
          left join to_merge_data tmd on m.id = tmd."memberId"
          left join no_merge_data nmd on m.id = nmd."memberId"
          left join member_tags mt on m.id = mt."memberId"
          left join member_organizations mo on m.id = mo."memberId"
        where m."tenantId" = $(tenantId) and m."deletedAt" is null
        limit ${perPage} offset ${(page - 1) * perPage};`,
      {
        tenantId,
      },
    )

    return results
  }

  public async getMemberData(id: string): Promise<IMemberSyncData | null> {
    const result = await this.db().oneOrNone(
      `
      with to_merge_data as (select mtm."memberId",
                                array_agg(distinct mtm."toMergeId"::text) as to_merge_ids
                        from "memberToMerge" mtm
                                  inner join members m2 on mtm."toMergeId" = m2.id
                        where mtm."memberId" = $(id)
                          and m2."deletedAt" is null
                        group by mtm."memberId"),
      no_merge_data as (select mnm."memberId",
                                array_agg(distinct mnm."noMergeId"::text) as no_merge_ids
                        from "memberNoMerge" mnm
                                  inner join members m2 on mnm."noMergeId" = m2.id
                        where mnm."memberId" = $(id)
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
                      where mt."memberId" = $(id)
                        and t."deletedAt" is null
                      group by mt."memberId"),
      member_organizations as (select mo."memberId",
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
                                where mo."memberId" = $(id)
                                  and o."deletedAt" is null
                                group by mo."memberId"),
      identities as (select mi."memberId",
                            json_agg(
                                    json_build_object(
                                            'platform', mi.platform,
                                            'username', mi.username
                                        )
                                ) as identities
                      from "memberIdentities" mi
                      where mi."memberId" = $(id)
                      group by mi."memberId"),
      activity_data as (select a."memberId",
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
                        where a."memberId" = $(id)
                        group by a."memberId")
      select m.id,
        m."tenantId",
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
      from members m
          inner join identities i on m.id = i."memberId"
          inner join activity_data ad on m.id = ad."memberId"
          left join to_merge_data tmd on m.id = tmd."memberId"
          left join no_merge_data nmd on m.id = nmd."memberId"
          left join member_tags mt on m.id = mt."memberId"
          left join member_organizations mo on m.id = mo."memberId"
        where m.id = $(id)
              and m."deletedAt" is null;`,
      {
        id,
      },
    )

    return result
  }
}
