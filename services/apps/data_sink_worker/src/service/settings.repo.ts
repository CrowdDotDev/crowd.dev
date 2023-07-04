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
  ): Promise<void> {
    const defaultTypes = DEFAULT_ACTIVITY_TYPE_SETTINGS[platform]

    if (type in defaultTypes) {
      return
    }

    const results = await this.db().one(
      'select "customActivityTypes" from settings where "tenantId" = $(tenantId)',
      {
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
      `update settings set "customActivityTypes" = $(custom) where "tenantId" = $(tenantId)`,
      {
        tenantId,
        custom,
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
    const results = await this.db().one(
      'select "activityChannels" from segments where "tenantId" = $(tenantId) and id = $(segmentId)',
      {
        tenantId,
        segmentId,
      },
    )

    const channels = results.activityChannels

    if (platform in channels && channel in channels[platform]) {
      return
    }

    if (!(platform in channels)) {
      channels[platform] = []
    }

    channels[platform].push(channel)

    const result = await this.db().result(
      `update segments set "activityChannels" = $(channels) where "tenantId" = $(tenantId) and id = $(segmentId)`,
      {
        tenantId,
        segmentId,
        channels,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }
}
