import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'

class OrganizationRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
  ) {}

  async getOrgIdentitiesWithInvalidUrls(limit: number) {
    const result = await this.connection.any(
      `
            SELECT *
            FROM "organizationIdentities"
            WHERE value LIKE '%www%' AND (type = 'alternative-domain' OR type = 'primary-domain')
            LIMIT $(limit);
        `,
      {
        limit,
      },
    )

    return result
  }

  async findOrganizationIdentity(platform: string, value: string, type: string, verified: boolean) {
    let results = await this.connection.any(
      `
          SELECT *
          FROM "organizationIdentities"
          WHERE value = $(value)
          AND platform = $(platform)
          AND type = $(type)
          AND verified = $(verified);
        `,
      { value, platform, type, verified },
    )

    // Try to find the identity without the verified flag
    if (!results.length && !verified) {
      results = await this.connection.any(
        `
            SELECT *
            FROM "organizationIdentities"
            WHERE value = $(value)
            AND platform = $(platform)
            AND type = $(type);
          `,
        { value, platform, type },
      )
    }

    return results
  }

  async updateOrganizationIdentity(
    orgId: string,
    platform: string,
    newValue: string,
    oldValue: string,
    type: string,
    verified: boolean,
  ) {
    await this.connection.none(
      `
          UPDATE "organizationIdentities"
          SET value = $(newValue)
          WHERE "organizationId" = $(orgId)
          AND platform = $(platform)
          AND value = $(oldValue)
          AND type = $(type)
          AND verified = $(verified);
      `,
      { orgId, platform, newValue, oldValue, type, verified },
    )
  }

  async deleteOrganizationIdentity(
    orgId: string,
    platform: string,
    type: string,
    value: string,
    verified: boolean,
  ) {
    await this.connection.none(
      `
          DELETE FROM "organizationIdentities"
          WHERE "organizationId" = $(orgId)
          AND platform = $(platform)
          AND type = $(type)
          AND value = $(value)
          AND verified = $(verified);
      `,
      { orgId, platform, type, value, verified },
    )
  }

  public async getOrganizationsForCleanup(batchSize: number): Promise<string[]> {
    // No activities linked to this organization
    // No members linked to this organization (considering soft delete)
    const results = await this.connection.any(
      `
        SELECT o.id as "orgId"
            FROM organizations o
            WHERE
              NOT EXISTS (
                SELECT 1
                FROM activities a
                WHERE a."organizationId" = o.id
                  AND a."deletedAt" IS NULL
              )
              AND NOT EXISTS (
                SELECT 1
                FROM "memberOrganizations" mo
                WHERE mo."organizationId" = o.id
                  AND mo."deletedAt" IS NULL
              )
              AND NOT EXISTS (
                SELECT 1
                FROM "cleanupExcludeList" cel
                WHERE cel."entityId" = o.id
                  AND cel."type" = 'organization'
              )
            LIMIT $(batchSize);
      `,
      {
        batchSize,
      },
    )

    return results.map((r) => r.orgId)
  }

  public async cleanupOrganization(organizationId: string): Promise<void> {
    const tables = [
      'organizationNoMerge',
      'organizationToMerge',
      'organizationToMergeRaw',
      'memberSegmentAffiliations',
      'organizationSegmentsAgg',
      'organizationSegments',
      'orgAttributes',
      'organizationIdentities',
      'organizations',
    ]

    await this.connection.tx(async (tx) => {
      for (const table of tables) {
        await tx.none(
          `DELETE FROM "${table}" WHERE "organizationId" = $(organizationId) 
          ${table === 'organizationNoMerge' ? 'OR "noMergeId" = $(organizationId)' : ''}
          ${table === 'organizationToMerge' || table === 'organizationToMergeRaw' ? 'OR "toMergeId" = $(organizationId)' : ''}
          `,
          { organizationId },
        )
      }
    })
  }

  public async addEntityToCleanupExcludeList(entityId: string, type: string): Promise<void> {
    await this.connection.none(
      `
      INSERT INTO "cleanupExcludeList" ("entityId", "type") VALUES ($(entityId), $(type))
      ON CONFLICT DO NOTHING
      `,
      { entityId, type },
    )
  }
}

export default OrganizationRepository
