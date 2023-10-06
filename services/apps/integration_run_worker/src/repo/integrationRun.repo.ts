import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IntegrationRunState, IntegrationStreamState } from '@crowd/types'
import { WORKER_CONFIG } from '../conf'
import {
  IGenerateStreamsData,
  IPendingDelayedRun,
  IStartIntegrationRunData,
} from './integrationRun.data'

export default class IntegrationRunRepository extends RepositoryBase<IntegrationRunRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async getPendingDelayedRuns(page: number, perPage: number): Promise<IPendingDelayedRun[]> {
    const results = await this.db().any(
      `
      select r.id,
             r."tenantId",
             i.platform as "integrationType"
      from integration.runs r
      inner join integrations i on r."integrationId" = i.id
      where r.state = $(delayedState) and r."delayedUntil" < now()
       order by r."delayedUntil" asc
       limit ${perPage} offset ${(page - 1) * perPage}
      `,
      {
        delayedState: IntegrationRunState.DELAYED,
      },
    )

    return results
  }

  public async resetDelayedRun(runId: string): Promise<void> {
    const result = await this.db().result(
      `
      update integration.runs
      set state = $(state),
          "delayedUntil" = null,
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

  public async createRun(
    tenantId: string,
    integrationId: string,
    onboarding: boolean,
  ): Promise<string> {
    const result = await this.db().one(
      `
      insert into integration.runs("tenantId", "integrationId", onboarding, state)
      values($(tenantId), $(integrationId), $(onboarding), $(state)) returning id;
      `,
      {
        tenantId,
        integrationId,
        onboarding,
        state: IntegrationRunState.PENDING,
      },
    )

    return result.id
  }

  public async getTenantsWithIntegrations(): Promise<string[]> {
    const results = await this.db().any(
      `
      select distinct "tenantId" from integrations where "deletedAt" is null;
      `,
    )

    return results.map((r) => r.tenantId)
  }

  public async getTenantIntegrations(tenantId: string): Promise<IStartIntegrationRunData[]> {
    const results = await this.db().any(
      `
      select id,
             platform as type,
             status as state,
             "integrationIdentifier" as identifier,
             "tenantId"
      from integrations where "tenantId" = $(tenantId) and "deletedAt" is null
    `,
      {
        tenantId,
      },
    )

    return results
  }

  public async getIntegrationData(integrationId: string): Promise<IStartIntegrationRunData | null> {
    const results = await this.db().oneOrNone(
      `
      select id,
             platform as type,
             status as state,
             "integrationIdentifier" as identifier,
             "tenantId"
      from integrations where id = $(integrationId) and "deletedAt" is null
    `,
      {
        integrationId,
      },
    )

    return results
  }

  public async getGenerateStreamData(runId: string): Promise<IGenerateStreamsData | null> {
    const results = await this.db().oneOrNone(
      `
    with stream_count as (select "runId", count(id) as stream_count
                          from integration.streams
                         where "runId" = $(runId)
                         group by "runId")
    select r."integrationId",
          i."integrationIdentifier",
          r."tenantId",
          r.onboarding,
          t."hasSampleData",
          t."plan",
          t."isTrialPlan",
          t."name",
          i.platform                  as "integrationType", 
          i.status                    as "integrationState",
          r.state                     as "runState",
          r.id                        as "runId",
          i.settings                  as "integrationSettings",
          i.token                     as "integrationToken",
          coalesce(c.stream_count, 0) as "streamCount"
      from integration.runs r
              inner join integrations i on (r."integrationId" = i.id and i."deletedAt" is null)
              inner join tenants t on r."tenantId" = t.id
              left join stream_count c on c."runId" = r.id
    where r.id = $(runId);
  `,
      {
        runId,
      },
    )

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

  public async isIntegrationBeingProcessed(integrationId: string): Promise<boolean> {
    const result = await this.db().oneOrNone(
      `
      select id from integration.runs
      where "integrationId" = $(integrationId) and state in ($(states:csv))
      order by "createdAt" desc
      limit 1
      `,
      {
        integrationId,
        states: [
          IntegrationRunState.DELAYED,
          IntegrationRunState.PROCESSING,
          IntegrationRunState.PENDING,
        ],
      },
    )

    return result !== null
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
      `update integrations set status = $(state), "updatedAt" = now() where id = (select "integrationId" from integration.runs where id = $(runId) limit 1)`,
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

  public async getIntegrationSettings(integrationId: string): Promise<unknown> {
    const result = await this.db().one(
      `
      select settings
      from integrations
      where id = $(integrationId)
    `,
      {
        integrationId,
      },
    )

    return result.settings
  }

  public async findIntegrationRunById(runId: string): Promise<{
    id: string
    state: IntegrationRunState
    tenantId: string
    integrationId: string
    platform: string
  } | null> {
    const result = await this.db().oneOrNone(
      `
      select r.id, r.state, r."tenantId", r."integrationId", i.platform
      from integration.runs r
      inner join integrations i on r."integrationId" = i.id
      where r.id = $(runId)
    `,
      {
        runId,
      },
    )

    return result
  }

  public async restart(runId: string): Promise<void> {
    const result = await this.db().result(
      `
      update integration.runs
         set state = $(state),
             "processedAt" = null,
              error = null,
              "delayedUntil" = null,
             "updatedAt" = now()
       where id = $(runId)
    `,
      {
        runId,
        state: IntegrationRunState.PENDING,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }
}
