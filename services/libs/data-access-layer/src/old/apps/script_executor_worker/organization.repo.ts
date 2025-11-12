import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IMemberOrganization } from '@crowd/types'

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
      SELECT o.id AS "orgId"
      FROM organizations o
      WHERE NOT EXISTS (SELECT 1
                        FROM "activityRelations" a
                        WHERE a."organizationId" = o.id)
        AND NOT EXISTS (SELECT 1
                        FROM "memberOrganizations" mo
                        WHERE mo."organizationId" = o.id)
        AND NOT EXISTS (SELECT 1
                        FROM "organizationIdentities" oi
                        WHERE oi."organizationId" = o.id)
        AND o."manuallyCreated" != true
      LIMIT $(batchSize);
      `,
      {
        batchSize,
      },
    )

    return results.map((r) => r.orgId)
  }

  public async cleanupOrganization(organizationId: string): Promise<void> {
    const tablesToDelete = [
      { name: 'organizationNoMerge', conditions: ['organizationId', 'noMergeId'] },
      { name: 'organizationToMerge', conditions: ['organizationId', 'toMergeId'] },
      { name: 'organizationToMergeRaw', conditions: ['organizationId', 'toMergeId'] },
      { name: 'organizationEnrichmentCache', conditions: ['organizationId'] },
      { name: 'organizationEnrichments', conditions: ['organizationId'] },
      { name: 'memberSegmentAffiliations', conditions: ['organizationId'] },
      { name: 'organizationSegmentsAgg', conditions: ['organizationId'] },
      { name: 'organizationSegments', conditions: ['organizationId'] },
      { name: 'orgAttributes', conditions: ['organizationId'] },
      { name: 'organizationIdentities', conditions: ['organizationId'] },
      { name: 'organizations', conditions: ['id'] },
    ]

    await this.connection.tx(async (tx) => {
      for (const table of tablesToDelete) {
        const whereClause = table.conditions
          .map((field) => `"${field}" = $(organizationId)`)
          .join(' OR ')
        await tx.none(`DELETE FROM "${table.name}" WHERE ${whereClause}`, { organizationId })
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

  async deleteMemberOrganizations(memberId: string): Promise<void> {
    await this.connection.none(
      `UPDATE "memberOrganizations" SET "deletedAt" = now() WHERE "memberId" = $(memberId)`,
      { memberId },
    )
  }

  async findOrganizationMembers(
    organizationId: string,
    limit: number,
    offset: number,
  ): Promise<IMemberOrganization[]> {
    return this.connection.any(
      `
      SELECT * FROM "memberOrganizations" 
      WHERE "organizationId" = $(organizationId) AND "deletedAt" IS NULL 
      ORDER BY "memberId", "id"
      LIMIT $(limit) OFFSET $(offset)`,
      { organizationId, limit, offset },
    )
  }

  public async pruneOrganization(organizationId: string): Promise<void> {
    const tablesToDelete = [
      { name: 'organizationNoMerge', conditions: ['organizationId', 'noMergeId'] },
      { name: 'organizationToMerge', conditions: ['organizationId', 'toMergeId'] },
      { name: 'organizationToMergeRaw', conditions: ['organizationId', 'toMergeId'] },
      { name: 'organizationEnrichmentCache', conditions: ['organizationId'] },
      { name: 'organizationEnrichments', conditions: ['organizationId'] },
      { name: 'memberSegmentAffiliations', conditions: ['organizationId'] },
      { name: 'organizationSegmentsAgg', conditions: ['organizationId'] },
      { name: 'organizationSegments', conditions: ['organizationId'] },
      { name: 'orgAttributes', conditions: ['organizationId'] },
      { name: 'organizationIdentities', conditions: ['organizationId'] },
      { name: 'memberOrganizations', conditions: ['organizationId'] },
      { name: 'organizations', conditions: ['id'] },
    ]

    await this.connection.tx(async (tx) => {
      for (const table of tablesToDelete) {
        const whereClause = table.conditions
          .map((field) => `"${field}" = $(organizationId)`)
          .join(' OR ')
        await tx.none(`DELETE FROM "${table.name}" WHERE ${whereClause}`, { organizationId })
      }
    })
  }

  public async getOrganizationsToPrune(
    batchSize: number,
  ): Promise<{ id: string; displayName: string }[]> {
    return this.connection.query(
      `
      WITH email_providers AS (
        SELECT unnest(ARRAY[
            'gmail.com', 'gmail.co.uk', 'gmail.com.au', 'gmail.com.tr',
            'yahoo.com', 'yahoo.co.uk', 'yahoo.com.br', 'yahoo.co.in', 'yahoo.fr', 'yahoo.es', 'yahoo.it', 'yahoo.de', 'yahoo.ca', 'yahoo.com.au', 'yahoo.in', 'yahoo.co.jp', 'yahoo.com.ar', 'yahoo.com.mx', 'yahoo.co.id', 'yahoo.com.sg', 'yahoo.co.za', 'yahoo.com.ph', 'yahoo.com.tw', 'yahoo.com.hk', 'yahoo.com.vn',
            'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.ca', 'hotmail.it', 'hotmail.es', 'hotmail.de', 'hotmail.com.au', 'hotmail.com.mx',
            'icloud.com', 'icloud.com.cn',
            'fastmail.com', 'tutanota.com', 'tuta.io',
            'gmx.com', 'gmx.de', 'gmx.net', 'gmx.at', 'gmx.ch', 'gmx.fr', 'gmx.co.uk',
            'aol.com', 'aol.co.uk', 'aol.fr', 'aol.de',
            'msn.com', 'wanadoo.fr', 'orange.fr', 'comcast.net',
            'live.com', 'live.co.uk', 'live.fr', 'live.nl', 'live.it', 'live.com.au', 'live.ca', 'live.cn',
            'rediffmail.com', 'sify.com', 'indiatimes.com', 'free.fr', 'web.de',
            'yandex.ru', 'yandex.com', 'yandex.com.tr', 'ya.ru',
            'ymail.com', 'libero.it',
            'outlook.com', 'outlook.fr', 'outlook.co.uk', 'outlook.de', 'outlook.es', 'outlook.it', 'outlook.com.au', 'outlook.com.br', 'outlook.com.mx', 'outlook.co.jp', 'outlook.in', 'outlook.com.sg', 'outlook.co.za', 'outlook.co.in',
            'uol.com.br', 'bol.com.br',
            'mail.ru', 'inbox.ru', 'list.ru', 'bk.ru',
            'mail.com', 'mail.de', 'mail.co.uk',
            'cox.net', 'sbcglobal.net', 'sfr.fr', 'verizon.net', 'googlemail.com', 'ig.com.br', 'bigpond.com', 'bigpond.net.au', 'terra.com.br', 'neuf.fr', 'alice.it', 'rocketmail.com', 'att.net', 'laposte.net', 'bellsouth.net', 'charter.net', 'rambler.ru', 'tiscali.it', 'tiscali.co.uk', 'shaw.ca', 'sky.com', 'earthlink.net', 'optonline.net', 'freenet.de', 't-online.de', 'aliceadsl.fr', 'virgilio.it', 'home.nl', 'qq.com', 'vip.qq.com', 'telenet.be', 'pandora.be', 'me.com', 'voila.fr', 'planet.nl', 'tin.it', 'ntlworld.com', 'arcor.de', 'frontiernet.net', 'hetnet.nl', 'zonnet.nl', 'club-internet.fr', 'juno.com', 'optusnet.com.au', 'blueyonder.co.uk', 'bluewin.ch', 'skynet.be', 'sympatico.ca', 'windstream.net', 'mac.com', 'centurytel.net', 'chello.nl', 'aim.com',
            'protonmail.com', 'protonmail.ch', 'proton.me', 'pm.me', 'duck.com',
            'zoho.com', 'zohomail.com',
            'users.noreply.github.com',
            '126.com', '139.com', '163.com', '188.com', 'foxmail.com', 'tom.com', '21cn.com', 'yeah.net',
            'naver.com', 'daum.net', 'hanmail.net',
            'hey.com', 'inbox.com', 'lycos.com', 'excite.com', 'hushmail.com', 'mailfence.com', 'mailbox.org', 'posteo.de', 'startmail.com', 'runbox.com', 'countermail.com', 'mynet.com',
            'wp.pl', 'onet.pl', 'interia.pl', 'o2.pl',
            'seznam.cz', 'centrum.cz',
            'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com'
        ]) AS provider
      )
      SELECT DISTINCT o.id, o."displayName"
      FROM organizations o
      INNER JOIN "organizationIdentities" oi
          ON o.id = oi."organizationId"
      INNER JOIN email_providers ep
          ON LOWER(oi.value) = ep.provider
      WHERE o."deletedAt" IS NULL
        AND oi.type = 'primary-domain'
      AND NOT EXISTS (
          SELECT 1
          FROM "memberOrganizations" mo
          WHERE mo."organizationId" = o.id
            AND (mo.title IS NOT NULL AND mo.title != '')
            AND (mo.source IS NOT NULL AND mo.source NOT IN ('email-domain'))
      )
      `,
      { batchSize },
    )
  }
}

export default OrganizationRepository
