import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'

class OrganizationRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
  ) {}

  async getOrgIdentitiesWithInvalidUrls(tenantId: string, limit: number) {
    const result = await this.connection.any(
      `
            SELECT *
            FROM "organizationIdentities"
            WHERE value LIKE '%www%' AND (type = 'alternative-domain' OR type = 'primary-domain')
            AND "tenantId" = $(tenantId) LIMIT $(limit);
        `,
      {
        tenantId,
        limit,
      },
    )

    return result
  }

  async findOrganizationIdentity(
    value: string,
    platform: string,
    type: string,
    verified: boolean,
    tenantId: string,
  ) {
    const result = await this.connection.oneOrNone(
      `
          SELECT *
          FROM "organizationIdentities"
          WHERE value = $(value)
          AND platform = $(platform)
          AND type = $(type)
          AND verified = $(verified)
          AND "tenantId" = $(tenantId);
        `,
      { value, platform, type, verified, tenantId },
    )

    return result
  }

  async updateOrgIdentity(
    orgId: string,
    website: string,
    platform: string,
    type: string,
    verified: boolean,
    tenantId: string,
  ) {
    await this.connection.none(
      `
          UPDATE "organizationIdentities"
          SET value = $(website)
          WHERE "organizationId" = $(orgId)
          AND platform = $(platform)
          AND type = $(type)
          AND verified = $(verified)
          AND "tenantId" = $(tenantId);
      `,
      { orgId, website, platform, type, verified, tenantId },
    )
  }

  async deleteOrgIdentity(
    orgId: string,
    platform: string,
    type: string,
    value: string,
    verified: boolean,
    tenantId: string,
  ) {
    await this.connection.none(
      `
          DELETE FROM "organizationIdentities"
          WHERE "organizationId" = $(orgId)
          AND platform = $(platform)
          AND type = $(type)
          AND value = $(value)
          AND verified = $(verified)
          AND "tenantId" = $(tenantId);
      `,
      { orgId, platform, type, value, verified, tenantId },
    )
  }
}

export default OrganizationRepository
