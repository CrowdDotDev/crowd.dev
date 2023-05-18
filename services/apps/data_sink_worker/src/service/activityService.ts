import { Logger, LoggerBase } from '@crowd/logging'
import { IActivityData, PlatformType } from '@crowd/types'

export default class ActivityService extends LoggerBase {
  constructor(parentLog: Logger) {
    super(parentLog)
  }

  public async processActivity(
    integrationId: string,
    platform: PlatformType,
    activity: IActivityData,
  ): Promise<void> {
    this.log.debug({ integrationId, platform, activity }, 'Processing activity.')
  }
}
