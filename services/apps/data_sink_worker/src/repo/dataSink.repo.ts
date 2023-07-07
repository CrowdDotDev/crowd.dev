import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IFailedResultData, IResultData } from './dataSink.data'
import { IntegrationResultState } from '@crowd/types'

export default class DataSinkRepository extends RepositoryBase<DataSinkRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  private readonly getResultInfoQuery = `
    select r.id,
           r.state,
           r.data, 
           r."tenantId",
           r."runId",
           r."streamId",
           r."apiDataId",
           r."integrationId",
           i.platform,
           t."hasSampleData", 
           t."plan",
           t."isTrialPlan",
           t."name"
    from integration.results r
        inner join integrations i on r."integrationId" = i.id
        inner join tenants t on t.id = r."tenantId"
    where r.id = $(resultId)
  `
  public async getResultInfo(resultId: string): Promise<IResultData | null> {
    const result = await this.db().oneOrNone(this.getResultInfoQuery, { resultId })
    return result
  }

  public async markResultInProgress(resultId: string): Promise<void> {
    const result = await this.db().result(
      `update integration.results
       set  state = $(state),
            "updatedAt" = now()
       where id = $(resultId)`,
      {
        resultId,
        state: IntegrationResultState.PROCESSING,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async markResultError(resultId: string, error: unknown): Promise<void> {
    const result = await this.db().result(
      `update integration.results
         set state = $(state),
             "processedAt" = now(),
             error = $(error),
             "updatedAt" = now()
       where id = $(resultId)`,
      {
        resultId,
        state: IntegrationResultState.ERROR,
        error: JSON.stringify(error),
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async markResultProcessed(resultId: string): Promise<void> {
    const result = await this.db().result(
      `update integration.results
       set  state = $(state),
            "processedAt" = now(),
            "updatedAt" = now()
       where id = $(resultId)`,
      {
        resultId,
        state: IntegrationResultState.PROCESSED,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async touchRun(runId: string): Promise<void> {
    const result = await this.db().result(
      `
      update integration.runs
         set "updatedAt" = now()
       where id = $(runId)
    `,
      {
        runId,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async getFailedResults(
    runId: string,
    page: number,
    perPage: number,
  ): Promise<IFailedResultData[]> {
    const results = await this.db().any(
      `select r.id,
              r."tenantId",
              i.platform
        from integration.results r
         inner join integrations i on i.id = r."integrationId"
        where r."runId" = $(runId) and r.state = $(state)
       order by r."createdAt" asc
       limit $(perPage) offset $(offset)`,
      {
        runId,
        state: IntegrationResultState.ERROR,
        perPage,
        offset: (page - 1) * perPage,
      },
    )

    return results
  }

  public async resetResults(resultIds: string[]): Promise<void> {
    const result = await this.db().result(
      `update integration.results
        set state = $(newState),
            error = null,
            "updatedAt" = now()
        where id in ($(resultIds:csv))`,
      {
        resultIds,
        newState: IntegrationResultState.PENDING,
      },
    )

    this.checkUpdateRowCount(result.rowCount, resultIds.length)
  }
}
