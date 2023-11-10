import { generateUUIDv1 } from '@crowd/common'
import { DbColumnSet, DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import {
  IntegrationRunState,
  IntegrationStreamDataState,
  IntegrationStreamState,
  WebhookState,
  WebhookType,
} from '@crowd/types'
import {
  IInsertableWebhookStream,
  IProcessableStream,
  IStreamData,
  getInsertWebhookStreamColumnSet,
} from './integrationStream.data'
import { IWebhookData } from './incomingWebhook.data'

export default class IntegrationStreamRepository extends RepositoryBase<IntegrationStreamRepository> {
  private readonly insertWebhookStreamColumnSet: DbColumnSet

  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)

    this.insertWebhookStreamColumnSet = getInsertWebhookStreamColumnSet(this.dbInstance)
  }

  public async getOldWebhooksToProcess(limit: number): Promise<IWebhookData[]> {
    this.ensureTransactional()

    try {
      const results = await this.db().any(
        `
        select  iw.id,
                iw."tenantId",
                iw."integrationId",
                iw.state,
                iw.type,
                iw.payload,
                iw."createdAt" as "createdAt",
                i.platform as "platform"
        from "incomingWebhooks" iw
                 inner join integrations i on iw."integrationId" = i.id
                 left join integration.streams s on iw.id = s."webhookId"
        where s.id is null
          and iw.type <> $(discourseType)
          and iw.state = $(pendingState)
          and iw."createdAt" < now() - interval '1 hour'
        limit ${limit}
        for update skip locked;
        `,
        {
          discourseType: WebhookType.DISCOURSE,
          pendingState: WebhookState.PENDING,
        },
      )

      return results
    } catch (err) {
      this.log.error(err, 'Error getting old webhooks to process')
      throw err
    }
  }

  public async getOldStreamsToProcess(limit: number): Promise<string[]> {
    this.ensureTransactional()

    try {
      const results = await this.db().any(
        `
        select id
        from integration.streams s
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
          errorState: IntegrationStreamState.ERROR,
          pendingState: IntegrationStreamState.PENDING,
          delayedState: IntegrationStreamState.DELAYED,
          maxRetries: 5,
        },
      )

      return results.map((s) => s.id)
    } catch (err) {
      this.log.error(err, 'Error getting old streams to process')
      throw err
    }
  }

  public async touchUpdatedAt(streamIds: string[]): Promise<void> {
    if (streamIds.length === 0) {
      return
    }

    try {
      await this.db().none(
        `
        update integration.streams set "updatedAt" = now()
        where id in ($(streamIds:csv))
      `,
        {
          streamIds,
        },
      )
    } catch (err) {
      this.log.error(err, 'Failed to touch updatedAt for streams!')
      throw err
    }
  }

  public async getPendingDelayedStreams(
    page: number,
    perPage: number,
  ): Promise<IProcessableStream[]> {
    const results = await this.db().any(
      `
        select s.id,
               s."tenantId",
               i.platform as "integrationType",
               s."runId",
               s."webhookId"
        from integration.streams s
        inner join integrations i on i.id = s."integrationId"
        where s.state = $(delayedState) and s."delayedUntil" < now()
        order by s."delayedUntil" asc
        limit ${perPage} offset ${(page - 1) * perPage}
      `,
      {
        delayedState: IntegrationStreamState.DELAYED,
      },
    )

    return results
  }

  public async getPendingStreams(
    runId: string,
    limit: number,
    lastId?: string,
  ): Promise<IProcessableStream[]> {
    let results: IProcessableStream[]

    if (lastId) {
      results = await this.db().any(
        `
          select s.id,
                 s."tenantId",
                 i.platform as "integrationType"
          from integration.streams s
          inner join integrations i on i.id = s."integrationId"
          where s."runId" = $(runId) and s.state = $(state) and s.id > $(lastId)
          order by s.id
          limit ${limit}
        `,
        {
          runId,
          lastId,
          state: IntegrationStreamState.PENDING,
        },
      )
    } else {
      results = await this.db().any(
        `
          select s.id,
                 s."tenantId",
                 i.platform as "integrationType"
          from integration.streams s
          inner join integrations i on i.id = s."integrationId"
          where s."runId" = $(runId) and s.state = $(state)
          order by s.id
          limit ${limit}
        `,
        {
          runId,
          state: IntegrationStreamState.PENDING,
        },
      )
    }

    return results
  }

  public async getStreamData(streamId: string): Promise<IStreamData | null> {
    const results = await this.db().oneOrNone(
      `
    select  r.onboarding,
            s."integrationId",
            i.platform as "integrationType",
            i.status   as "integrationState",
            i."integrationIdentifier",
            i.token   as "integrationToken",
            i."refreshToken" as "integrationRefreshToken",
            r.state    as "runState",
            s."runId",
            s."tenantId",
            s."webhookId",
            i.settings as "integrationSettings",
            s.id,
            s.state,
            s."parentId",
            s.identifier,
            s.data,
            coalesce(s.retries, 0) as retries
      from integration.streams s
              inner join integrations i on s."integrationId" = i.id
              left join integration.runs r on r.id = s."runId"
      where s.id = $(streamId);
    `,
      {
        streamId,
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

  public async deleteStream(streamId: string): Promise<void> {
    const result = await this.db().result(
      `delete from integration.streams where id = $(streamId)`,
      {
        streamId,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async delayStream(streamId: string, until: Date): Promise<void> {
    const result = await this.db().result(
      `update integration.streams
       set  state = $(state),
            "delayedUntil" = $(until),
            retries = coalesce(retries, 0) + 1,
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
             retries = coalesce(retries, 0) + 1,
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

  public async publishData(streamId: string, data: unknown): Promise<string> {
    const id = generateUUIDv1()

    const result = await this.db().result(
      `
    insert into integration."apiData"(id, state, data, "streamId", "runId", "webhookId", "tenantId", "integrationId", "microserviceId")
    select $(id)::uuid,
           $(state),
           $(data)::json,
           $(streamId)::uuid,
           "runId",
           "webhookId",
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

  public async publishWebhookStreams(records: IInsertableWebhookStream[]): Promise<void> {
    const preparedObjects = RepositoryBase.prepareBatch(
      records.map((w) => {
        return {
          identifier: w.identifier,
          webhookId: w.webhookId,
          data: w.data ? JSON.stringify(w.data) : null,
          integrationId: w.integrationId,
          tenantId: w.tenantId,
          state: IntegrationStreamState.PENDING,
        }
      }),
      this.insertWebhookStreamColumnSet,
    )
    const query = this.dbInstance.helpers.insert(preparedObjects, this.insertWebhookStreamColumnSet)
    await this.db().any(query)
  }

  public async publishWebhookStream(
    identifier: string,
    webhookId: string,
    data: unknown,
    integrationId: string,
    tenantId: string,
  ): Promise<string> {
    const result = await this.db().one(
      `
    insert into integration.streams("webhookId", state, identifier, data, "tenantId", "integrationId")
    values ($(webhookId)::uuid, $(state), $(identifier), $(data)::json, $(tenantId), $(integrationId))
    returning id;
    `,
      {
        webhookId,
        state: IntegrationStreamState.PENDING,
        identifier: identifier,
        data: data ? JSON.stringify(data) : null,
        tenantId,
        integrationId,
      },
    )

    return result.id
  }

  public async getStreamIdByWebhookId(webhookId: string): Promise<string | undefined> {
    const result = await this.db().oneOrNone(
      `
    select id
    from integration.streams
    where "webhookId" = $(webhookId)
    limit 1;
    `,
      {
        webhookId,
      },
    )

    if (result) {
      return result.id
    }

    return undefined
  }
}
