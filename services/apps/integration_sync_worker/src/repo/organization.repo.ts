import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IOrganization, PlatformType } from '@crowd/types'

export class OrganizationRepository extends RepositoryBase<OrganizationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async setIntegrationSourceId(
    organizationId: string,
    platform: string,
    sourceId: string,
  ): Promise<void> {
    const organization = await this.db().oneOrNone(
      `select id, attributes from organizations where id = $(organizationId)`,
      { organizationId },
    )

    if (
      !organization.attributes ||
      (organization.attributes && Object.keys(organization.attributes).length === 0)
    ) {
      organization.attributes = {
        sourceId: {
          [platform]: sourceId,
        },
      }
    } else if (organization.attributes?.sourceId) {
      organization.attributes.sourceId[platform] = sourceId
    } else {
      organization.attributes.sourceId = {
        [platform]: sourceId,
      }
    }

    this.log.debug(`Updating organization ${organization.id} ${platform} sourceId to ${sourceId}.`)
    await this.db().none(
      `update organizations set "attributes" = $(attributes)::jsonb where id = $(organizationId)`,
      {
        organizationId,
        attributes: JSON.stringify(organization.attributes),
      },
    )
  }

  public async findOrganizationAttributes(organizationId: string): Promise<any> {
    return await this.db().oneOrNone(
      `select id, attributes from organizations where id = $(organizationId)`,
      {
        organizationId,
      },
    )
  }

  public async findMarkedOrganizations(
    tenantId: string,
    platform: PlatformType,
    segmentId: string,
    limit: number,
    offset: number,
  ): Promise<IOrganization> {
    const organizationAttribute = `COALESCE(((attributes -> 'syncRemote'::text) -> '${platform}'::text)::boolean, false)`

    let results

    if (segmentId) {
      results = await this.db().any(
        `
        select o.id, o.attributes, o."createdAt"
        from organizations o
        left join "organizationSegments" os on os."organizationId" = o.id
        where ${organizationAttribute} is true
          and o."tenantId" = $(tenantId)
        and os."segmentId" = $(segmentId)
        group by o.id, o.attributes, o."createdAt"
            order by "createdAt" desc
        limit $(limit) offset $(offset)`,
        {
          tenantId,
          segmentId,
          limit,
          offset,
        },
      )
    } else {
      results = await this.db().any(
        `
        select id, attributes, "createdAt" from organizations 
        where ${organizationAttribute} is true
        and "tenantId" = $(tenantId)
        order by "createdAt" desc
        limit $(limit) offset $(offset)`,
        {
          tenantId,
          limit,
          offset,
        },
      )
    }

    return results
  }

  public async findOrganization(organizationId: string, tenantId: string): Promise<IOrganization> {
    return await this.db().oneOrNone(
      `
      WITH
      activity_counts AS (
          SELECT mo."organizationId", COUNT(a.id) AS "activityCount"
          FROM "memberOrganizations" mo
          LEFT JOIN activities a ON a."memberId" = mo."memberId"
          WHERE mo."organizationId" = $(organizationId)
          GROUP BY mo."organizationId"
      ),
      member_counts AS (
          SELECT "organizationId", COUNT(DISTINCT "memberId") AS "memberCount"
          FROM "memberOrganizations"
          WHERE "organizationId" = $(organizationId)
          GROUP BY "organizationId"
      ),
      active_on AS (
          SELECT mo."organizationId", ARRAY_AGG(DISTINCT platform) AS "activeOn"
          FROM "memberOrganizations" mo
          JOIN activities a ON a."memberId" = mo."memberId"
          WHERE mo."organizationId" = $(organizationId)
          GROUP BY mo."organizationId"
      ),
      identities AS (
          SELECT "organizationId", ARRAY_AGG(DISTINCT platform) AS "identities"
          FROM "memberOrganizations" mo
          JOIN "memberIdentities" mi ON mi."memberId" = mo."memberId"
          WHERE mo."organizationId" = $(organizationId)
          GROUP BY "organizationId"
      ),
      last_active AS (
          SELECT mo."organizationId", MAX(timestamp) AS "lastActive", MIN(timestamp) AS "joinedAt"
          FROM "memberOrganizations" mo
          JOIN activities a ON a."memberId" = mo."memberId"
          WHERE mo."organizationId" = $(organizationId)
          GROUP BY mo."organizationId"
      ),
      segments AS (
          SELECT "organizationId", ARRAY_AGG("segmentId") AS "segments"
          FROM "organizationSegments"
          WHERE "organizationId" = $(organizationId)
          GROUP BY "organizationId"
      )
  SELECT
      o.*,
      COALESCE(ac."activityCount", 0)::INTEGER AS "activityCount",
      COALESCE(mc."memberCount", 0)::INTEGER AS "memberCount",
      COALESCE(ao."activeOn", '{}') AS "activeOn",
      COALESCE(id."identities", '{}') AS "identities",
      COALESCE(s."segments", '{}') AS "segments",
      a."lastActive",
      a."joinedAt"
  FROM organizations o
  LEFT JOIN activity_counts ac ON ac."organizationId" = o.id
  LEFT JOIN member_counts mc ON mc."organizationId" = o.id
  LEFT JOIN active_on ao ON ao."organizationId" = o.id
  LEFT JOIN identities id ON id."organizationId" = o.id
  LEFT JOIN last_active a ON a."organizationId" = o.id
  LEFT JOIN segments s ON s."organizationId" = o.id
  WHERE o.id = $(organizationId)
    AND o."tenantId" = $(tenantId);`,
      {
        organizationId,
        tenantId,
      },
    )
  }
}
