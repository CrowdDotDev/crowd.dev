import { DbStore } from '@crowd/database'
import { Logger, LoggerBase } from '@crowd/logging'
import { OpenSearchService } from './opensearch.service'
import { ActivityRepository } from '@/repo/activity.repo'

export class ActivitySearchService extends LoggerBase {
  private readonly activityRepo: ActivityRepository

  constructor(
    store: DbStore,
    private readonly openSearchService: OpenSearchService,
    parentLog: Logger,
  ) {
    super(parentLog)

    this.activityRepo = new ActivityRepository(store, this.log)
  }
}
