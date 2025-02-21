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

  public async getMembersForSync(perPage: number): Promise<string[]> {
    const results = await this.db().any(
      `
        SELECT m.id
        FROM members m
        WHERE NOT EXISTS (
          SELECT 1
          FROM indexed_entities ie 
          WHERE ie.entity_id = m.id
            AND ie.type = $(type)
        )
        ORDER BY m.id
        LIMIT ${perPage};
      `,
      {
        type: IndexedEntityType.MEMBER,
      },
    )
    return results.map((r) => r.id)
  }

  public async getOrganizationMembersForSync(
    organizationId: string,
    perPage: number,
    lastId?: string,
    syncFrom?: Date,
  ): Promise<string[]> {
    const rows = await this.db().any(
      `
        SELECT
            DISTINCT mo."memberId"
        FROM "memberOrganizations" mo
        INNER JOIN members m ON mo."memberId" = m.id
        ${syncFrom !== undefined ? 'LEFT JOIN "memberSegmentsAgg" msa ON m.id = msa."memberId"' : ''}
        WHERE mo."organizationId" = $(organizationId) AND
            mo."deletedAt" is null AND
            ${syncFrom !== undefined ? '(msa."createdAt" < $(syncFrom) OR msa."createdAt" IS NULL) AND' : ''}
            ${lastId !== undefined ? 'mo."memberId" > $(lastId) AND' : ''}
            m."deletedAt" is null AND
            exists (select 1 from "memberIdentities" where "memberId" = mo."memberId")
        ORDER BY mo."memberId"
        LIMIT ${perPage};
      `,
      {
        organizationId,
        lastId,
        syncFrom,
      },
    )

    return rows.map((r) => r.memberId)
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
          group by msa."memberId")
  select
    m.id,
    m."tenantId",
    m."displayName",
    m.attributes,
    coalesce(m.contributions, '[]'::jsonb)              as contributions,
    m.score,
    m."joinedAt",
    m."manuallyCreated",
    m."createdAt",
    m.reach,
    coalesce(jsonb_array_length(m.contributions), 0)   as "numberOfOpenSourceContributions",

    coalesce(i.identities, '[]'::json)            as "identities",
    coalesce(mo.all_organizations, json_build_array()) as organizations,
    coalesce(mt.all_tags, json_build_array())          as tags,
    coalesce(ma.all_affiliations, json_build_array())  as affiliations,
    coalesce(tmd.to_merge_ids, array []::text[])       as "toMergeIds",
    coalesce(nmd.no_merge_ids, array []::text[])       as "noMergeIds"
  from members m
    inner join identities i on m.id = i."memberId"
    left join to_merge_data tmd on m.id = tmd."memberId"
    left join no_merge_data nmd on m.id = nmd."memberId"
    left join member_tags mt on m.id = mt."memberId"
    left join member_affiliations ma on m.id = ma."memberId"
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
      where m."tenantId" = $(tenantId) and
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
