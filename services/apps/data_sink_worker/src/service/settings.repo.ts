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
    const existingData = await this.db().oneOrNone(
      `select "activityChannels" from "segments" where "tenantId" = $(tenantId) and id = $(segmentId)`,
      {
        tenantId,
        segmentId,
      },
    )

    if (existingData) {
      const channels = existingData.activityChannels

      if (channels && channels[platform] && channels[platform].includes(channel)) {
        return
      } else {
        await this.db().result(
          `
          update segments
            set "activityChannels" =
                    case
                        -- If platform exists, and channel does not exist, add it
                        when "activityChannels" ? $(platform)
                            and not ($(channel) = any (select jsonb_array_elements_text("activityChannels" -> $(platform)))) then
                            jsonb_set(
                                    "activityChannels",
                                    array [$(platform)::text],
                                    "activityChannels" -> $(platform) || jsonb_build_array($(channel))
                                )
                        -- If platform does not exist, create it
                        when not ("activityChannels" ? $(platform)) or "activityChannels" is null then
                                coalesce("activityChannels", '{}'::jsonb) ||
                                jsonb_build_object($(platform), jsonb_build_array($(channel)))
                        -- Else, do nothing
                        else
                            "activityChannels"
                        end
          where "tenantId" = $(tenantId)
            and id = $(segmentId)
            and case
                  -- If platform exists, and channel does not exist, add it
                  when "activityChannels" ? $(platform)
                      and not ($(channel) = any (select jsonb_array_elements_text("activityChannels" -> $(platform)))) then
                      1
                  -- If platform does not exist, create it
                  when not ("activityChannels" ? $(platform)) or "activityChannels" is null then
                      1
                  -- Else, do nothing
                  else
                      0
                end = 1
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
  }
}
