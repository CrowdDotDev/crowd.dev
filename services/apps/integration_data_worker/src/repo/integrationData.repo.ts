import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import {
  IIntegrationResult,
  IntegrationResultState,
  IntegrationRunState,
  IntegrationStreamDataState,
  IntegrationStreamState,
} from '@crowd/types'
import { IApiDataInfo } from './integrationData.data'

export default class IntegrationDataRepository extends RepositoryBase<IntegrationDataRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  private readonly getDataInfoQuery = `
    select  r.onboarding,
            d."integrationId",
            i.platform as "integrationType",
            i.status   as "integrationState",
            i."integrationIdentifier",
            i.token   as "integrationToken",
            i."refreshToken" as "integrationRefreshToken",
            r.state    as "runState",
            d."streamId",
            d."runId",
            d."webhookId",
            d."tenantId",
            i.settings as "integrationSettings",
            d.id,
            d.state,
            d.data,
            t."hasSampleData",
            t."plan",
            t."isTrialPlan",
            t."name",
            coalesce(d.retries, 0) as retries
      from integration."apiData" d
              inner join integrations i on d."integrationId" = i.id
              left join integration.runs r on r.id = d."runId"
              inner join tenants t on t.id = d."tenantId"
      where d.id = $(dataId);
  `

  private readonly getDataForTenantQuery = `
    select
      d.id
    from 
     integration."apiData" d
    where 
     d."tenantId" = $(tenantId)
  `

  public async getDataInfo(dataId: string): Promise<IApiDataInfo | null> {
    const results = await this.db().oneOrNone(this.getDataInfoQuery, {
      dataId,
    })

    return results
  }

  public async getOldDataToProcess(limit: number): Promise<string[]> {
    this.ensureTransactional()

    try {
      const results = await this.db().any(
        `
        select id
        from integration."apiData"
        where (
                (state = $(errorState) and retries <= $(maxRetries))
                or
                (state = $(pendingState))
                or
                (state = $(delayedState) and "delayedUntil" < now())
            )
          and "updatedAt" < now() - interval '1 hour'
        order by case when "webhookId" is not null then 0 else 1 end,
                "webhookId" asc,
                "updatedAt" desc
        limit ${limit}
        for update skip locked;
        `,
        {
          errorState: IntegrationStreamDataState.ERROR,
          pendingState: IntegrationStreamDataState.PENDING,
          delayedState: IntegrationStreamDataState.DELAYED,
          maxRetries: 5,
        },
      )

      return results.map((s) => s.id)
    } catch (err) {
      this.log.error(err, 'Error getting old data to process')
      throw err
    }
  }

  public async touchUpdatedAt(dataIds: string[]): Promise<void> {
    if (dataIds.length === 0) {
      return
    }

    try {
      await this.db().none(
        `
        update integration."apiData" set "updatedAt" = now()
        where id in ($(dataIds:csv))
      `,
        {
          dataIds,
        },
      )
    } catch (err) {
      this.log.error(err, 'Failed to touch updatedAt for data!')
      throw err
    }
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

  public async markDataError(dataId: string, error: unknown): Promise<void> {
    const result = await this.db().result(
      `update integration."apiData"
         set state = $(state),
             "processedAt" = now(),
             error = $(error),
             retries = retries + 1,
             "updatedAt" = now()
       where id = $(dataId)`,
      {
        dataId,
        state: IntegrationStreamDataState.ERROR,
        error: JSON.stringify(error),
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async updateIntegrationSettings(dataId: string, settings: unknown): Promise<void> {
    const result = await this.db().result(
      `
      update "integrations"
         set settings = settings || $(settings)::jsonb,
            "updatedAt" = now()
       where id = (select "integrationId" from integration."apiData" where id = $(dataId) limit 1)
    `,
      {
        dataId,
        settings: JSON.stringify(settings),
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async updateIntegrationToken(runId: string, token: string): Promise<void> {
    const result = await this.db().result(
      `
      update "integrations"
      set token = $(token),
          "updatedAt" = now()
      where id = (select "integrationId" from integration.runs where id = $(runId) limit 1)
    `,
      {
        runId,
        token,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async updateIntegrationRefreshToken(runId: string, refreshToken: string): Promise<void> {
    const result = await this.db().result(
      `
      update "integrations"
      set "refreshToken" = $(refreshToken),
          "updatedAt" = now()
      where id = (select "integrationId" from integration.runs where id = $(runId) limit 1)
    `,
      {
        runId,
        refreshToken,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async publishResult(dataId: string, result: IIntegrationResult): Promise<string> {
    const results = await this.db().oneOrNone(
      `
    insert into integration.results(state, data, "apiDataId", "streamId", "runId", "webhookId", "tenantId", "integrationId", "microserviceId")
    select $(state),
           $(data)::json,
           $(dataId)::uuid,
           "streamId",
           "runId",
           "webhookId",
           "tenantId",
           "integrationId",
           "microserviceId"
    from integration."apiData" where id = $(dataId)
    returning id;
    `,
      {
        dataId,
        state: IntegrationResultState.PENDING,
        data: JSON.stringify(result),
      },
    )

    if (results) {
      return results.id
    }

    return null
  }

  public async publishStream(
    parentId: string,
    identifier: string,
    data?: unknown,
    runId?: string,
    webhookId?: string,
  ): Promise<string | null> {
    const result = await this.db().oneOrNone(
      `
    insert into integration.streams("parentId", "runId", "webhookId", state, identifier, data, "tenantId", "integrationId", "microserviceId")
    select $(parentId)::uuid,
           $(runId)::uuid,
           $(webhookId)::uuid,
           $(state),
           $(identifier),
           $(data)::json,
           "tenantId",
           "integrationId",
           "microserviceId"
    from integration.runs where id = $(runId)
    on conflict ("runId", identifier) do nothing
    returning id;
    `,
      {
        parentId,
        runId,
        webhookId,
        state: IntegrationStreamState.PENDING,
        identifier: identifier,
        data: data ? JSON.stringify(data) : null,
      },
    )

    if (result) {
      return result.id
    }

    return null
  }

  public async markDataInProgress(dataId: string): Promise<void> {
    const result = await this.db().result(
      `update integration."apiData"
       set  state = $(state),
            "updatedAt" = now()
       where id = $(dataId)`,
      {
        dataId,
        state: IntegrationStreamDataState.PROCESSING,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async deleteData(dataId: string): Promise<void> {
    const result = await this.db().result(
      `delete from integration."apiData" where id = $(dataId)`,
      {
        dataId,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async delayData(dataId: string, until: Date): Promise<void> {
    const result = await this.db().result(
      `update integration."apiData"
       set  state = $(state),
            "delayedUntil" = $(until),
            "updatedAt" = now()
       where id = $(dataId)`,
      {
        dataId,
        until,
        state: IntegrationStreamDataState.DELAYED,
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

  public async resetStream(dataId: string): Promise<void> {
    const result = await this.db().result(
      `update integration."apiData"
       set  state = $(state),
            error = null,
            "delayedUntil" = null,
            "processedAt" = null,
            "updatedAt" = now()
       where id = $(dataId)`,
      {
        dataId,
        state: IntegrationStreamDataState.PENDING,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async getDataForTenant(tenantId: string): Promise<string[]> {
    const results = await this.db().manyOrNone(this.getDataForTenantQuery, {
      tenantId,
    })

    return results.map((r) => r.id)
  }
}
