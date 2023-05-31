import { generateUUIDv1 } from '@crowd/common'
import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IStreamData } from './integrationStream.data'
import {
  IntegrationRunState,
  IntegrationStreamDataState,
  IntegrationStreamState,
} from '@crowd/types'

export default class IntegrationStreamRepository extends RepositoryBase<IntegrationStreamRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  private readonly getStreamDataQuery = `
  select  r.onboarding,
          s."integrationId",
          i.platform as "integrationType",
          i.status   as "integrationState",
          i."integrationIdentifier",
          r.state    as "runState",
          s."runId",
          s."tenantId",
          i.settings as "integrationSettings",
          s.id,
          s.state,
          s."parentId",
          s.identifier,
          s.data,
          coalesce(s.retries, 0) as retries
    from integration.streams s
            inner join integrations i on s."integrationId" = i.id
            inner join integration.runs r on r.id = s."runId"
    where s.id = $(streamId);
  `
  public async getStreamData(streamId: string): Promise<IStreamData | null> {
    const results = await this.db().oneOrNone(this.getStreamDataQuery, {
      streamId,
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

  public async resetStream(streamId: string): Promise<void> {
    const result = await this.db().result(
      `update integration.streams
       set  state = $(state),
            error = null,
            "delayedUntil" = null,
            "processedAt" = null,
            "updatedAt" = now()
       where id = $(streamId)`,
      {
        streamId,
        state: IntegrationStreamState.PENDING,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async markStreamInProgress(streamId: string): Promise<void> {
    const result = await this.db().result(
      `update integration.streams
       set  state = $(state),
            "updatedAt" = now()
       where id = $(streamId)`,
      {
        streamId,
        state: IntegrationStreamState.PROCESSING,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async markStreamProcessed(streamId: string): Promise<void> {
    const result = await this.db().result(
      `update integration.streams
       set  state = $(state),
            "processedAt" = now(),
            "updatedAt" = now()
       where id = $(streamId)`,
      {
        streamId,
        state: IntegrationStreamState.PROCESSED,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async delayStream(streamId: string, until: Date): Promise<void> {
    const result = await this.db().result(
      `update integration.streams
       set  state = $(state),
            "delayedUntil" = $(until),
            "updatedAt" = now()
       where id = $(streamId)`,
      {
        streamId,
        until,
        state: IntegrationStreamState.DELAYED,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async delayRun(runId: string, until: Date): Promise<void> {
    const result = await this.db().result(
      `update integration.runs
       set  state = $(state),
            "delayedUntil" = $(until),
            "updatedAt" = now()
       where id = $(runId)`,
      {
        runId,
        until,
        state: IntegrationRunState.DELAYED,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async markStreamError(streamId: string, error: unknown): Promise<void> {
    const result = await this.db().result(
      `update integration.streams
         set state = $(state),
             "processedAt" = now(),
             error = $(error),
             retries = retries + 1,
             "updatedAt" = now()
       where id = $(streamId)`,
      {
        streamId,
        state: IntegrationStreamState.ERROR,
        error: JSON.stringify(error),
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

  public async updateIntegrationSettings(streamId: string, settings: unknown): Promise<void> {
    const result = await this.db().result(
      `
      update "integrations"
         set settings = settings || $(settings)::jsonb,
            "updatedAt" = now()
       where id = (select "integrationId" from integration.streams where id = $(streamId) limit 1)
    `,
      {
        streamId,
        settings: JSON.stringify(settings),
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async publishData(streamId: string, data: unknown): Promise<string> {
    const id = generateUUIDv1()

    const result = await this.db().result(
      `
    insert into integration."apiData"(id, state, data, "streamId", "runId", "tenantId", "integrationId", "microserviceId")
    select $(id)::uuid,
           $(state),
           $(data)::json,
           $(streamId)::uuid,
           "runId",
           "tenantId",
           "integrationId",
           "microserviceId"
    from integration.streams where id = $(streamId);
    `,
      {
        id,
        streamId,
        state: IntegrationStreamDataState.PENDING,
        data: JSON.stringify(data),
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)

    return id
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
}
