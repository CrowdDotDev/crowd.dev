import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IIntegrationResult, IntegrationResultState, TenantPlans } from '@crowd/types'
import { IDelayedResults, IFailedResultData, IResultData } from './dataSink.data'
import { distinct, singleOrDefault } from '@crowd/common'

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
           r."webhookId",
           r."streamId",
           r."apiDataId",
           r."integrationId",
           r.retries,
           r."delayedUntil",
           i.platform,
           t."hasSampleData", 
           t."plan",
           t."isTrialPlan",
           t."name",
           run.onboarding
    from integration.results r
        inner join integrations i on r."integrationId" = i.id
        inner join tenants t on t.id = r."tenantId"
        left join integration.runs run on run.id = r."runId"
    where r.id = $(resultId)
  `
  public async getResultInfo(resultId: string): Promise<IResultData | null> {
    const result = await this.db().oneOrNone(this.getResultInfoQuery, { resultId })
    return result
  }

  public async createResult(
    tenantId: string,
    integrationId: string,
    result: IIntegrationResult,
  ): Promise<string> {
    const results = await this.db().one(
      `
    insert into integration.results(state, data, "tenantId", "integrationId")
    values($(state), $(data), $(tenantId), $(integrationId))
    returning id;
    `,
      {
        tenantId,
        integrationId,
        state: IntegrationResultState.PENDING,
        data: JSON.stringify(result),
      },
    )

    return results.id
  }

  public async getOldResultsToProcess(limit: number): Promise<string[]> {
    this.ensureTransactional()

    try {
      const results = await this.db().any(
        `
        select r.id
        from integration.results r
        where r.state = $(pendingState)
          and r."updatedAt" < now() - interval '1 hour'
        limit ${limit}
        for update skip locked;
        `,
        {
          pendingState: IntegrationResultState.PENDING,
          plans: [TenantPlans.Growth, TenantPlans.Scale],
        },
      )

      return results.map((s) => s.id)
    } catch (err) {
      this.log.error(err, 'Failed to get old results to process!')
      throw err
    }
  }

  public async touchUpdatedAt(resultIds: string[]): Promise<void> {
    if (resultIds.length === 0) {
      return
    }

    try {
      await this.db().none(
        `
        update integration.results set "updatedAt" = now()
        where id in ($(resultIds:csv))
      `,
        {
          resultIds,
        },
      )
    } catch (err) {
      this.log.error(err, 'Failed to touch updatedAt for results!')
      throw err
    }
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

  public async deleteResult(resultId: string): Promise<void> {
    await this.db().none(`delete from integration.results where id = $(resultId)`, {
      resultId,
    })
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

  public async getFailedResults(page: number, perPage: number): Promise<IFailedResultData[]> {
    const results = await this.db().any(
      `select r.id,
              r."tenantId",
              i.platform,
              t.plan,
              t."priorityLevel" as "dbPriority",
              run.onboarding
        from integration.results r
         inner join integrations i on i.id = r."integrationId"
         inner join tenants t on t.id = r."tenantId"
         left join integration.runs run on run.id = r."runId"
        where r.state = $(state)
       order by r."createdAt" asc
       limit $(perPage) offset $(offset)`,
      {
        state: IntegrationResultState.ERROR,
        perPage,
        offset: (page - 1) * perPage,
      },
    )

    return results
  }

  public async getFailedResultsForRun(
    runId: string,
    page: number,
    perPage: number,
  ): Promise<IFailedResultData[]> {
    const results = await this.db().any(
      `select r.id,
              r."tenantId",
              i.platform,
              t.plan,
              t."priorityLevel" as "dbPriority",
              run.onboarding
        from integration.results r
         inner join integrations i on i.id = r."integrationId"
         inner join tenants t on t.id = r."tenantId"
         inner join integration.runs run on run.id = r."runId"
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
            "updatedAt" = now(),
            "delayedUntil" = null
        where id in ($(resultIds:csv))`,
      {
        resultIds,
        newState: IntegrationResultState.PENDING,
      },
    )

    this.checkUpdateRowCount(result.rowCount, resultIds.length)
  }

  public async getSegmentIds(tenantId: string): Promise<string[]> {
    const result = await this.db().any(`select id from "segments" where "tenantId" = $(tenantId)`, {
      tenantId,
    })

    return result.map((r) => r.id)
  }

  public async delayResult(resultId: string, until: Date): Promise<void> {
    const result = await this.db().result(
      `update integration.results
       set  state = $(state),
            "delayedUntil" = $(until),
            retries = coalesce(retries, 0) + 1,
            "updatedAt" = now()
       where id = $(resultId)`,
      {
        resultId,
        until,
        state: IntegrationResultState.DELAYED,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async getDelayedResults(limit: number): Promise<IDelayedResults[]> {
    this.ensureTransactional()

    try {
      const resultData = await this.db().any(
        `
        select r.id,
               r."tenantId",
               i.platform,
               r."runId"
        from integration.results r
        inner join integrations i on r."integrationId" = i.id
        where r.state = $(delayedState) and r."delayedUntil" < now()
        limit ${limit}
        for update skip locked;
        `,
        {
          delayedState: IntegrationResultState.DELAYED,
        },
      )

      const runIds = distinct(resultData.map((r) => r.runId))
      if (runIds.length > 0) {
        const runInfos = await this.db().any(
          `
        select id, onboarding
        from integration.runs
        where id in ($(runIds:csv))
        `,
          {
            runIds,
          },
        )

        for (const result of resultData) {
          const runInfo = singleOrDefault(runInfos, (r) => r.id === result.runId)
          if (runInfo) {
            result.onboarding = runInfo.onboarding
          } else {
            result.onboarding = true
          }
        }
      }

      return resultData
    } catch (err) {
      this.log.error(err, 'Failed to get delayed results!')
      throw err
    }
  }
}
