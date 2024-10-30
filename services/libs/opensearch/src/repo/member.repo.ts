import { IMemberSegment } from '@crowd/data-access-layer'
import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { RedisCache, RedisClient } from '@crowd/redis'
import { IMemberAttribute } from '@crowd/types'

import { IndexedEntityType } from './indexing.data'
import { IDbMemberSyncData, IMemberIdData, IMemberSegmentMatrix } from './member.data'

export class MemberRepository extends RepositoryBase<MemberRepository> {
  private readonly cache: RedisCache

  constructor(redisClient: RedisClient, dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)

    this.cache = new RedisCache('memberAttributes', redisClient, this.log)
  }

  public async getTenantIds(): Promise<string[]> {
    const results = await this.db().any(`select distinct "tenantId" from members;`)

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

  public async getTenantMembersForSync(tenantId: string, perPage: number): Promise<string[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await this.db().any(
      `
        select m.id
        from members m
        left join indexed_entities ie on m.id = ie.entity_id and ie.type = $(type)
        where m."tenantId" = $(tenantId) and 
              ie.entity_id is null
        limit ${perPage};`,
      {
        tenantId,
        type: IndexedEntityType.MEMBER,
      },
    )

    return results.map((r) => r.id)
  }

  public async getOrganizationMembersForSync(
    organizationId: string,
    perPage: number,
    lastId?: string,
  ): Promise<IMemberIdData[]> {
    return await this.db().any(
      `
      select distinct mo."memberId", m."manuallyCreated"
      from "memberOrganizations" mo
      inner join members m on mo."memberId" = m.id
      where mo."organizationId" = $(organizationId) and
            mo."deletedAt" is null and
            ${lastId !== undefined ? 'mo."memberId" > $(lastId) and' : ''}
            m."deletedAt" is null and
            exists (select 1 from "memberIdentities" where "memberId" = mo."memberId")
      order by mo."memberId"
      limit ${perPage};`,
      {
        organizationId,
        lastId,
      },
    )
  }

  public async getMemberData(memberId: string): Promise<IDbMemberSyncData[]> {
    const results = await this.db().oneOrNone(
      ` 
  with to_merge_data as (
        select mtm."memberId",
        array_agg(distinct mtm."toMergeId"::text) as to_merge_ids
        from "memberToMerge" mtm
              inner join members m2 on mtm."toMergeId" = m2.id
        where mtm."memberId" = $(memberId)
        and m2."deletedAt" is null
        group by mtm."memberId"),
  no_merge_data as (
        select mnm."memberId",
        array_agg(distinct mnm."noMergeId"::text) as no_merge_ids
        from "memberNoMerge" mnm
          inner join members m2 on mnm."noMergeId" = m2.id
        where mnm."memberId" = $(memberId)
        and m2."deletedAt" is null
        group by mnm."memberId"),
  member_tags as (
        select mt."memberId",
        json_agg(
              json_build_object(
                      'id', t.id,
                      'name', t.name
                  )
        )           as all_tags,
      jsonb_agg(t.id) as all_ids
      from "memberTags" mt
        inner join tags t on mt."tagId" = t.id
      where mt."memberId" = $(memberId)
      and t."deletedAt" is null
      group by mt."memberId"),
  member_organizations as (
      select mo."memberId",
      json_agg(
              json_build_object(
                      'id', o.id,
                      'logo', o.logo,
                      'displayName', o."displayName",
                      'memberOrganizations', json_build_object(
                                    'dateStart', mo."dateStart",
                                    'dateEnd', mo."dateEnd",
                                    'source', mo."source",
                                    'title', mo.title
                      )
                  )
          )           as all_organizations,
      jsonb_agg(o.id) as all_ids
      from "memberOrganizations" mo
        inner join organizations o on mo."organizationId" = o.id
      where mo."memberId" = $(memberId)
      and mo."deletedAt" is null
      and o."deletedAt" is null
      group by mo."memberId"),
  identities as (
      select mi."memberId",
      json_agg(
            json_build_object(
                    'platform', mi.platform,
                    'value', mi.value,
                    'type', mi.type,
                    'sourceId', mi."sourceId",
                    'integrationId', mi."integrationId",
                    'verified', mi.verified
                )
      ) as identities
      from "memberIdentities" mi
      where mi."memberId" = $(memberId)
      group by mi."memberId"),
  member_affiliations as (
          select msa."memberId",
          json_agg(
                  json_build_object(
                          'id', msa.id,
                          'segmentId', s.id,
                          'segmentSlug', s.slug,
                          'segmentName', s.name,
                          'segmentParentName', s."parentName",
                          'organizationId', o.id,
                          'organizationName', o."displayName",
                          'organizationLogo', o.logo,
                          'dateStart', msa."dateStart",
                          'dateEnd', msa."dateEnd"
                      )
              )           as all_affiliations,
          jsonb_agg(msa.id) as all_ids
          from "memberSegmentAffiliations" msa
            left join organizations o on o.id = msa."organizationId"
            inner join segments s on s.id = msa."segmentId"
          where msa."memberId" = $(memberId)
          group by msa."memberId"),
  member_notes as (
        select mn."memberId",
        json_agg(
              json_build_object(
                      'id', n.id,
                      'body', n.body
                  )
        )           as all_notes,
        jsonb_agg(n.id) as all_ids
        from "memberNotes" mn
          inner join notes n on mn."noteId" = n.id
          where mn."memberId" = $(memberId)
          and n."deletedAt" is null
          group by mn."memberId"),
  member_tasks as (
        select mtk."memberId",
        json_agg(
              json_build_object(
                      'id', tk.id,
                      'name', tk.name,
                      'body', tk.body,
                      'status', tk.status,
                      'dueDate', tk."dueDate",
                      'type', tk.type
                  )
        )           as all_tasks,
        jsonb_agg(tk.id) as all_ids
        from "memberTasks" mtk
          inner join tasks tk on mtk."taskId" = tk.id
          where mtk."memberId" = $(memberId)
          and tk."deletedAt" is null
          group by mtk."memberId")
  select 
    m.id,
    m."tenantId",
    m."displayName",
    m.attributes,
    coalesce(m.contributions, '[]'::jsonb)              as contributions,
    m.score,
    m."lastEnriched",
    m."joinedAt",
    m."manuallyCreated",
    m."createdAt",
    m.reach,
    coalesce(jsonb_array_length(m.contributions), 0)   as "numberOfOpenSourceContributions",

    coalesce(i.identities, '[]'::json)            as "identities",
    coalesce(mo.all_organizations, json_build_array()) as organizations,
    coalesce(mt.all_tags, json_build_array())          as tags,
    coalesce(ma.all_affiliations, json_build_array())  as affiliations,
    coalesce(mn.all_notes, json_build_array())          as notes,
    coalesce(mtk.all_tasks, json_build_array())          as tasks,
    coalesce(tmd.to_merge_ids, array []::text[])       as "toMergeIds",
    coalesce(nmd.no_merge_ids, array []::text[])       as "noMergeIds"
  from members m
    inner join identities i on m.id = i."memberId"
    left join to_merge_data tmd on m.id = tmd."memberId"
    left join no_merge_data nmd on m.id = nmd."memberId"
    left join member_tags mt on m.id = mt."memberId"
    left join member_affiliations ma on m.id = ma."memberId"
    left join member_notes mn on m.id = mn."memberId"
    left join member_tasks mtk on m.id = mtk."memberId"
    left join member_organizations mo on m.id = mo."memberId"
  where m.id = $(memberId)
  and m."deletedAt" is null;`,
      {
        memberId,
      },
    )

    return results
  }

  public async checkMembersExists(tenantId: string, memberIds: string[]): Promise<IMemberIdData[]> {
    return await this.db().any(
      `
      select m.id as "memberId", m."manuallyCreated"
      from members m
      where m."tenantId" = $(tenantId ) and 
            m.id in ($(memberIds:csv)) and
            exists(select 1 from "memberIdentities" mi where mi."memberId" = m.id)
      `,
      {
        tenantId,
        memberIds,
      },
    )
  }

  public async getMemberSegmentCouples(
    memberIds: string[],
    memberSegmentCouples: IMemberSegment[],
    segmentIds?: string[],
  ): Promise<IMemberSegmentMatrix> {
    let memberSegments: IMemberSegment[] = memberSegmentCouples

    if (segmentIds && segmentIds.length > 0) {
      for (const memberId of memberIds) {
        for (const segmentId of segmentIds) {
          memberSegments.push({
            memberId,
            segmentId,
          })
        }
      }
    } else {
      // Manually created members don't have any activities,
      // filter out those memberIds that are not in the results
      const manuallyCreatedIds = memberIds.filter(
        (id) => !memberSegments.some((r) => r.memberId === id),
      )

      // memberSegments aren't maintained well, so use as a fallback for manuallyCreated members
      if (manuallyCreatedIds.length > 0) {
        const missingResults = await this.db().any(
          `
          select distinct ms."segmentId", ms."memberId"
          from "memberSegments" ms
          where ms."memberId" in ($(manuallyCreatedIds:csv));
          `,
          {
            manuallyCreatedIds,
          },
        )
        memberSegments = [...memberSegments, ...missingResults]
      }
    }

    const matrix = {}

    for (const memberSegment of memberSegments) {
      if (!matrix[memberSegment.memberId]) {
        matrix[memberSegment.memberId] = [
          {
            segmentId: memberSegment.segmentId,
          },
        ]
      } else {
        matrix[memberSegment.memberId].push({
          segmentId: memberSegment.segmentId,
        })
      }
    }

    return matrix
  }
}
