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
            r.state    as "runState",
            d."streamId",
            d."runId",
            d."tenantId",
            i.settings as "integrationSettings",
            d.id,
            d.state,
            d.data,
            coalesce(d.retries, 0) as retries
      from integration."apiData" d
              inner join integrations i on d."integrationId" = i.id
              inner join integration.runs r on r.id = d."runId"
      where d.id = $(dataId);
  `

  public async getDataInfo(dataId: string): Promise<IApiDataInfo | null> {
    const results = await this.db().oneOrNone(this.getDataInfoQuery, {
      dataId,
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

  public async publishResult(dataId: string, result: IIntegrationResult): Promise<string> {
    const results = await this.db().oneOrNone(
      `
    insert into integration.results(state, data, "apiDataId", "streamId", "runId", "tenantId", "integrationId", "microserviceId")
    select $(state),
           $(data)::json,
           $(dataId)::uuid,
           "streamId",
           "runId",
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
    runId: string,
    identifier: string,
    data?: unknown,
  ): Promise<string | null> {
    const result = await this.db().oneOrNone(
      `
    insert into integration.streams("parentId", "runId", state, identifier, data, "tenantId", "integrationId", "microserviceId")
    select $(parentId)::uuid,
           $(runId)::uuid,
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

  public async markDataProcessed(dataId: string): Promise<void> {
    const result = await this.db().result(
      `update integration."apiData"
       set  state = $(state),
            "processedAt" = now(),
            "updatedAt" = now()
       where id = $(dataId)`,
      {
        dataId,
        state: IntegrationStreamDataState.PROCESSED,
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
}
