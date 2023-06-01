import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IGenerateStreamsData } from './integrationRun.data'
import { IntegrationRunState, IntegrationStreamState } from '@crowd/types'
import { WORKER_CONFIG } from '../conf'

export default class IntegrationRunRepository extends RepositoryBase<IntegrationRunRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  private readonly getGenerateStreamDataQuery = `
    with stream_count as (select "runId", count(id) as stream_count
                          from integration.streams
                         where "runId" = $(runId)
                         group by "runId")
    select r."integrationId",
          i."integrationIdentifier",
          r."tenantId",
          r.onboarding,
          t."hasSampleData",
          i.platform                  as "integrationType", 
          i.status                    as "integrationState",
          r.state                     as "runState",
          r.id                        as "runId",
          i.settings                  as "integrationSettings",
          coalesce(c.stream_count, 0) as "streamCount"
      from integration.runs r
              inner join integrations i on (r."integrationId" = i.id and i."deletedAt" is null)
              inner join tenants t on r."tenantId" = t.id
              left join stream_count c on c."runId" = r.id
    where r.id = $(runId);
  `
  public async getGenerateStreamData(runId: string): Promise<IGenerateStreamsData | null> {
    const results = await this.db().oneOrNone(this.getGenerateStreamDataQuery, {
      runId,
    })

    return results
  }

  public async markRunError(runId: string, error: unknown): Promise<void> {
    const result = await this.db().result(
      `update integration.runs
         set state = $(state),
             "processedAt" = now(),
             error = $(error),
             "updatedAt" = now()
       where id = $(runId)`,
      {
        runId,
        state: IntegrationRunState.ERROR,
        error: JSON.stringify(error),
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async markRunInProgress(runId: string): Promise<void> {
    const result = await this.db().result(
      `
      update integration.runs
         set state = $(state),
            "updatedAt" = now()
       where id = $(runId)
    `,
      {
        runId,
        state: IntegrationRunState.PROCESSING,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async markRunProcessed(runId: string): Promise<void> {
    const result = await this.db().result(
      `
      update integration.runs
         set state = $(state),
             "processedAt" = now(),
             "updatedAt" = now()
       where id = $(runId)
    `,
      {
        runId,
        state: IntegrationRunState.PROCESSED,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async getLastRuns(runId: string, limit: number): Promise<IntegrationRunState[]> {
    const results = await this.db().any(
      `
        select state from integration.runs where "integrationId" = (select "integrationId" from integration.runs where id = $(runId) limit 1)
        where id != $(runId)
        order by "createdAt" desc
        limit $(limit)
      `,
      {
        runId,
        limit,
      },
    )

    return results.map((r) => r.state)
  }

  public async markIntegration(runId: string, state: string): Promise<void> {
    const result = await this.db().result(
      `update integrations set status = $(state) where id = (select "integrationId" from integration.runs where id = $(runId) limit 1)`,
      {
        runId,
        state,
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

  public async updateIntegrationSettings(runId: string, settings: unknown): Promise<void> {
    const result = await this.db().result(
      `
      update "integrations"
         set settings = settings || $(settings)::jsonb,
            "updatedAt" = now()
       where id = (select "integrationId" from integration.runs where id = $(runId) limit 1)
    `,
      {
        runId,
        settings: JSON.stringify(settings),
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async publishStream(runId: string, identifier: string, data?: unknown): Promise<string> {
    const result = await this.db().one(
      `
    insert into integration.streams("runId", state, identifier, data, "tenantId", "integrationId", "microserviceId")
    select $(runId)::uuid,
           $(state),
           $(identifier),
           $(data)::json,
           "tenantId",
           "integrationId",
           "microserviceId"
    from integration.runs where id = $(runId)
    returning id;
    `,
      {
        runId,
        state: IntegrationStreamState.PENDING,
        identifier: identifier,
        data: data ? JSON.stringify(data) : null,
      },
    )

    return result.id
  }

  public async getStreamCountsByState(runId: string): Promise<Map<IntegrationStreamState, number>> {
    const results = await this.db().any(
      `
      select state, count(id) as count from integration.streams
                                      where "runId" = $(runId)
      group by state;
      `,
      {
        runId,
      },
    )

    const map = new Map<IntegrationStreamState, number>()
    if (results.length === 0) {
      return map
    }

    for (const result of results) {
      map.set(result.state, parseInt(result.count, 10))
    }

    return map
  }

  public async getErrorStreamsPendingRetry(runId: string): Promise<number> {
    const result = await this.db().one(
      `
      select count(id) as count
      from integration.streams
      where "runId" = $(runId)
        and state = $(errorState)
        and retries < $(maxRetries)
      `,
      {
        runId,
        errorState: IntegrationStreamState.ERROR,
        maxRetries: WORKER_CONFIG().maxRetries,
      },
    )

    return result.count
  }
}
