import { DbStore } from '@crowd/database'
import { Logger, LoggerBase } from '@crowd/logging'

export default class IntegrationRunService extends LoggerBase {
  constructor(private readonly store: DbStore, parentLog: Logger) {
    super(parentLog)
  }

  public async generateStreams(runId: string): Promise<void> {}
}
