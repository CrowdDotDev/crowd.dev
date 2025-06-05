import { DEFAULT_TENANT_ID, generateUUIDv1 } from '@crowd/common'
import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { WebhookState, WebhookType } from '@crowd/types'
import { PlatformType } from '@crowd/types'

import { IDbIntegrationData } from './webhooks.data'

export class WebhooksRepository extends RepositoryBase<WebhooksRepository> {
  public constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async findIntegrationByIdentifier(
    platform: string,
    identifier: string,
  ): Promise<IDbIntegrationData | null> {
    const result = await this.db().oneOrNone(
      `
      select id, platform from integrations
      where platform = $(platform) and "integrationIdentifier" = $(identifier) and "deletedAt" is null
      order by "createdAt" desc
      limit 1
      `,
      {
        platform,
        identifier,
      },
    )

    return result
  }

  public async createIncomingWebhook(
    integrationId: string,
    type: WebhookType,
    payload: unknown,
  ): Promise<string> {
    const id = generateUUIDv1()
    const result = await this.db().result(
      `
      insert into "incomingWebhooks"(id, "tenantId", "integrationId", state, type, payload)
      values($(id), $(tenantId), $(integrationId), $(state), $(type), $(payload))
      `,
      {
        id,
        tenantId: DEFAULT_TENANT_ID,
        integrationId,
        type,
        state: WebhookState.PENDING,
        payload: JSON.stringify(payload),
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)

    return id
  }

  public async findGroupsIoIntegrationByGroupName(
    groupName: string,
  ): Promise<IDbIntegrationData | null> {
    const result = await this.db().oneOrNone(
      `
      select id, platform from integrations
      where platform = $(platform) and "deletedAt" is null
      and exists (
        select 1 from jsonb_array_elements(settings -> 'groups') as group_item
        where group_item ->> 'slug' = $(groupName)
      )
      `,
      {
        platform: PlatformType.GROUPSIO,
        groupName: groupName,
      },
    )

    return result
  }

  public async findIntegrationByPlatform(
    platform: PlatformType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<(IDbIntegrationData & { settings: any }) | null> {
    const result = await this.db().oneOrNone(
      `
      select id, platform, settings from integrations
      where platform = $(platform) and "deletedAt" is null
      `,
      {
        platform,
      },
    )

    return result
  }

  public async addGithubInstallation(
    installationId: string,
    type: string,
    login: string,
    avatarUrl: string | null,
    numRepos: number,
  ): Promise<void> {
    await this.db().none(
      `
      INSERT INTO "githubInstallations" ("installationId", "type", "login", "avatarUrl", "numRepos")
      VALUES ($(installationId), $(type), $(login), $(avatarUrl), $(numRepos))
      ON CONFLICT ("installationId") DO UPDATE
      SET "type" = EXCLUDED."type",
          "login" = EXCLUDED."login",
          "avatarUrl" = EXCLUDED."avatarUrl",
          "numRepos" = EXCLUDED."numRepos",
          "updatedAt" = CURRENT_TIMESTAMP
      `,
      {
        installationId,
        type,
        login,
        avatarUrl,
        numRepos,
      },
    )
  }

  public async deleteGithubInstallation(installationId: string): Promise<void> {
    await this.db().none(
      `
      DELETE FROM "githubInstallations" WHERE "installationId" = $(installationId)
      `,
      {
        installationId,
      },
    )
  }

  public async findIntegrationById(id: string): Promise<IDbIntegrationData | null> {
    const result = await this.db().oneOrNone(
      `
      select * from integrations
      where id = $(id) and "deletedAt" is null
      `,
      {
        id,
      },
    )

    return result
  }
}
