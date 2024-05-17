import { DbStore, RepositoryBase } from '@crowd/database'
import { DEFAULT_ACTIVITY_TYPE_SETTINGS } from '@crowd/integrations'
import { Logger } from '@crowd/logging'
import { PlatformType } from '@crowd/types'

export default class SettingsRepository extends RepositoryBase<SettingsRepository> {
  constructor(store: DbStore, parentLog: Logger) {
    super(store, parentLog)
  }

  public async createActivityType(
    tenantId: string,
    platform: PlatformType,
    type: string,
    segmentId: string,
  ): Promise<void> {
    const defaultTypes = DEFAULT_ACTIVITY_TYPE_SETTINGS[platform]

    if (defaultTypes && type in defaultTypes) {
      return
    }

    const results = await this.db().one(
      'select "customActivityTypes" from segments where id = $(segmentId) and "tenantId" = $(tenantId)',
      {
        segmentId,
        tenantId,
      },
    )

    const custom = results.customActivityTypes

    if (platform in custom && type in custom[platform]) {
      return
    }

    if (!(platform in custom)) {
      custom[platform] = {}
    }

    custom[platform][type] = {
      display: {
        default: type,
        short: type,
        channel: '',
      },
      isContribution: false,
    }

    const result = await this.db().result(
      `update segments set "customActivityTypes" = $(custom) where id = $(segmentId) and "tenantId" = $(tenantId)`,
      {
        tenantId,
        custom,
        segmentId,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async createActivityChannel(
    tenantId: string,
    segmentId: string,
    platform: string,
    channel: string,
  ): Promise<void> {
    await this.db().result(
      `
      INSERT INTO "segmentActivityChannels" ("tenantId", "segmentId", "platform", "channel") VALUES
        ($(tenantId), $(segmentId), $(platform), $(channel))
      ON CONFLICT DO NOTHING;
      `,
      {
        tenantId,
        segmentId,
        platform,
        channel,
      },
    )
  }
}
