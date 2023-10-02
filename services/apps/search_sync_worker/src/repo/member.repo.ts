import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { RedisCache, RedisClient } from '@crowd/redis'
import { IMemberAttribute } from '@crowd/types'
import { IDbMemberSyncData } from './member.data'

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

  public async getTenantMembersForSync(
    tenantId: string,
    perPage: number,
    lastId?: string,
  ): Promise<string[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let results: any[]

    if (lastId) {
      results = await this.db().any(
        `
          select m.id
          from members m
          where m."tenantId" = $(tenantId) and 
                m."deletedAt" is null and
                m.id > $(lastId) and
                (
                  exists (select 1 from activities where "memberId" = m.id) or
                  m."manuallyCreated"
                ) and
                exists (select 1 from "memberIdentities" where "memberId" = m.id)
          order by m.id
          limit ${perPage};`,
        {
          tenantId,
          lastId,
        },
      )
    } else {
      results = await this.db().any(
        `
          select m.id
          from members m
          where m."tenantId" = $(tenantId) and 
                m."deletedAt" is null and
                (
                  exists (select 1 from activities where "memberId" = m.id) or
                  m."manuallyCreated"
                ) and
                exists (select 1 from "memberIdentities" where "memberId" = m.id)
          order by m.id
          limit ${perPage};`,
        {
          tenantId,
        },
      )
    }

    return results.map((r) => r.id)
  }

  public async getOrganizationMembersForSync(
    organizationId: string,
    perPage: number,
    lastId?: string,
  ): Promise<string[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let results: any[]

    if (lastId) {
      results = await this.db().any(
        `
        select distinct mo."memberId"
        from "memberOrganizations" mo
        where mo."organizationId" = $(organizationId) and
              mo."deletedAt" is null and
              mo."memberId" > $(lastId) and
              (
                exists (select 1 from activities where "memberId" = mo."memberId") or
                exists (select 1 from members where "memberId" = mo."memberId" and "manuallyCreated")
              ) and
              exists (select 1 from "memberIdentities" where "memberId" = mo."memberId")
        order by mo."memberId"
        limit ${perPage};`,
        {
          organizationId,
          lastId,
        },
      )
    } else {
      results = await this.db().any(
        `
        select distinct mo."memberId"
        from "memberOrganizations" mo
        where mo."organizationId" = $(organizationId) and
              mo."deletedAt" is null and
              (
                exists (select 1 from activities where "memberId" = mo."memberId") or
                exists (select 1 from members where "memberId" = mo."memberId" and "manuallyCreated")
              ) and
              exists (select 1 from "memberIdentities" where "memberId" = mo."memberId")
        order by mo."memberId"
        limit ${perPage};`,
        {
          organizationId,
        },
      )
    }

    return results.map((r) => r.memberId)
  }

  public async getRemainingTenantMembersForSync(
    tenantId: string,
    page: number,
    perPage: number,
    cutoffDate: string,
  ): Promise<string[]> {
    const results = await this.db().any(
      `
      select id from members m
      where m."tenantId" = $(tenantId) and m."deletedAt" is null
       and (
        m."searchSyncedAt" is null or
        m."searchSyncedAt" < $(cutoffDate)
       ) and
       (
        exists (select 1 from activities where "memberId" = m.id) or
          m."manuallyCreated"
       )
      limit ${perPage} offset ${(page - 1) * perPage};
      `,
      {
        tenantId,
        cutoffDate,
      },
    )

    return results.map((r) => r.id)
  }

  public async getMemberData(ids: string[]): Promise<IDbMemberSyncData[]> {
    const results = await this.db().any(
      `
        WITH to_merge_data AS (
            SELECT
                mtm."memberId",
                array_agg(DISTINCT mtm."toMergeId"::text) AS to_merge_ids
            FROM "memberToMerge" mtm
            INNER JOIN members m2 ON mtm."toMergeId" = m2.id
            WHERE mtm."memberId" IN ($(ids:csv))
              AND m2."deletedAt" IS NULL
            GROUP BY mtm."memberId"
        ),
        no_merge_data AS (
            SELECT
                mnm."memberId",
                array_agg(DISTINCT mnm."noMergeId"::text) AS no_merge_ids
            FROM "memberNoMerge" mnm
            INNER JOIN members m2 ON mnm."noMergeId" = m2.id
            WHERE mnm."memberId" IN ($(ids:csv))
              AND m2."deletedAt" IS NULL
            GROUP BY mnm."memberId"
        ),
        member_tags AS (
            SELECT
                mt."memberId",
                json_agg(json_build_object(
                  'id', t.id,
                  'name', t.name
                )) AS all_tags,
                jsonb_agg(t.id) AS all_ids
            FROM "memberTags" mt
            INNER JOIN tags t ON mt."tagId" = t.id
            WHERE mt."memberId" IN ($(ids:csv))
              AND t."deletedAt" IS NULL
            GROUP BY mt."memberId"
        ),
        member_organizations AS (
            SELECT
                mo."memberId",
                os."segmentId",
                json_agg(json_build_object(
                  'id', o.id,
                  'logo', o.logo,
                  'displayName', o."displayName",
                  'memberOrganizations', json_build_object(
                    'dateStart', mo."dateStart",
                    'dateEnd', mo."dateEnd",
                    'title', mo.title
                  )
                )) AS all_organizations,
                jsonb_agg(o.id) AS all_ids
            FROM "memberOrganizations" mo
            INNER JOIN organizations o ON mo."organizationId" = o.id
            INNER JOIN "organizationSegments" os ON o.id = os."organizationId"
            WHERE mo."memberId" IN ($(ids:csv))
              AND mo."deletedAt" IS NULL
              AND o."deletedAt" IS NULL
            GROUP BY mo."memberId", os."segmentId"
        ),
        identities AS (
            SELECT
                mi."memberId",
                json_agg(json_build_object(
                  'platform', mi.platform,
                  'username', mi.username
                )) AS identities
            FROM "memberIdentities" mi
            WHERE mi."memberId" IN ($(ids:csv))
            GROUP BY mi."memberId"
        ),
        activity_data AS (
            SELECT
                a."memberId",
                a."segmentId",
                count(a.id) AS "activityCount",
                max(a.timestamp) AS "lastActive",
                array_agg(DISTINCT concat(a.platform, ':', a.type)) FILTER (WHERE a.platform IS NOT NULL) AS "activityTypes",
                array_agg(DISTINCT a.platform) FILTER (WHERE a.platform IS NOT NULL) AS "activeOn",
                count(DISTINCT a."timestamp"::date) AS "activeDaysCount",
                round(avg(
                    CASE WHEN (a.sentiment ->> 'sentiment'::text) IS NOT NULL THEN
                        (a.sentiment ->> 'sentiment'::text)::double precision
                    ELSE
                        NULL::double precision
                    END
                )::numeric, 2) AS "averageSentiment"
            FROM activities a
            WHERE a."memberId" IN ($(ids:csv))
            GROUP BY a."memberId", a."segmentId"
        )
        SELECT
            m.id,
            m."tenantId",
            ms."segmentId",
            m."displayName",
            m.attributes,
            m.emails,
            m.score,
            m."lastEnriched",
            m."joinedAt",
            m."manuallyCreated",
            m."createdAt",
            (m.reach -> 'total')::integer AS "totalReach",
            coalesce(jsonb_array_length(m.contributions), 0) AS "numberOfOpenSourceContributions",
            ad."activeOn",
            ad."activityCount",
            ad."activityTypes",
            ad."activeDaysCount",
            ad."lastActive",
            ad."averageSentiment",
            i.identities,
            coalesce(mo.all_organizations, json_build_array()) AS organizations,
            coalesce(mt.all_tags, json_build_array()) AS tags,
            coalesce(tmd.to_merge_ids, ARRAY[]::text[]) AS "toMergeIds",
            coalesce(nmd.no_merge_ids, ARRAY[]::text[]) AS "noMergeIds"
        FROM "memberSegments" ms
        INNER JOIN members m ON ms."memberId" = m.id
        INNER JOIN identities i ON m.id = i."memberId"
        LEFT JOIN activity_data ad ON ms."memberId" = ad."memberId"
            AND ms."segmentId" = ad."segmentId"
        LEFT JOIN to_merge_data tmd ON m.id = tmd."memberId"
        LEFT JOIN no_merge_data nmd ON m.id = nmd."memberId"
        LEFT JOIN member_tags mt ON ms."memberId" = mt."memberId"
        LEFT JOIN member_organizations mo ON ms."memberId" = mo."memberId"
            AND ms."segmentId" = mo."segmentId"
        WHERE ms."memberId" IN ($(ids:csv))
          AND m."deletedAt" IS NULL
          AND (ad."memberId" IS NOT NULL OR m."manuallyCreated");
      `,
      {
        ids,
      },
    )

    return results
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
            (
              exists (select 1 from activities where "memberId" = m.id) or
              m."manuallyCreated"
            ) and
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
