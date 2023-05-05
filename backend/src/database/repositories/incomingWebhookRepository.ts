import { v4 as uuid } from 'uuid'
import { QueryTypes } from 'sequelize'
import {
  DbIncomingWebhookInsertData,
  IncomingWebhookData,
  PendingWebhook,
  WebhookError,
  WebhookState,
} from '../../types/webhooks'
import { IRepositoryOptions } from './IRepositoryOptions'
import { RepositoryBase } from './repositoryBase'

/* eslint-disable class-methods-use-this */

export default class IncomingWebhookRepository extends RepositoryBase<
  IncomingWebhookData,
  string,
  DbIncomingWebhookInsertData,
  unknown,
  unknown
> {
  public constructor(options: IRepositoryOptions) {
    super(options, true)
  }

  async create(data: DbIncomingWebhookInsertData): Promise<IncomingWebhookData> {
    const transaction = this.transaction

    const id = uuid()

    const results = await this.seq.query(
      `
    insert into "incomingWebhooks"(id, "tenantId", "integrationId", state, type, payload)
    values(:id, :tenantId, :integrationId, :state, :type, :payload)
    returning "createdAt"
    `,
      {
        replacements: {
          id,
          tenantId: data.tenantId,
          integrationId: data.integrationId,
          type: data.type,
          state: WebhookState.PENDING,
          payload: JSON.stringify(data.payload),
        },
        type: QueryTypes.INSERT,
        transaction,
      },
    )

    return {
      id,
      state: WebhookState.PENDING,
      ...data,
      processedAt: null,
      error: null,
      createdAt: results[0][0].createdAt.toISOString(),
    }
  }

  override async findById(id: string): Promise<IncomingWebhookData> {
    const transaction = this.transaction

    const seq = this.seq

    const results = await seq.query(
      `
      select id,
             "tenantId",
             "integrationId",
             state,
             type,
             payload,
             "processedAt",
             error,
             "createdAt"
      from "incomingWebhooks"
      where id = :id
    `,
      {
        replacements: {
          id,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    if (results.length === 0) {
      return null
    }

    const data = results[0] as any

    return {
      id: data.id,
      tenantId: data.tenantId,
      integrationId: data.integrationId,
      state: data.state,
      type: data.type,
      payload: data.payload,
      processedAt: data.processedAt ? data.processedAt.toISOString() : null,
      error: data.error,
      createdAt: data.createdAt.toISOString(),
    }
  }

  async markCompleted(id: string): Promise<void> {
    const transaction = this.transaction

    const [, rowCount] = await this.seq.query(
      `
      update "incomingWebhooks"
      set state = :state,
          error = null,
          "processedAt" = now()
      where id = :id
    `,
      {
        replacements: {
          id,
          state: WebhookState.PROCESSED,
        },
        type: QueryTypes.UPDATE,
        transaction,
      },
    )

    if (rowCount !== 1) {
      throw new Error(`Failed to mark webhook '${id}' as completed!`)
    }
  }

  async markError(id: string, error: WebhookError): Promise<void> {
    const transaction = this.transaction

    const [, rowCount] = await this.seq.query(
      `
      update "incomingWebhooks"
      set state = :state,
          error = :error,
          "processedAt" = now()
          where id = :id
    `,
      {
        replacements: {
          id,
          state: WebhookState.ERROR,
          error: JSON.stringify({
            message: error.message,
            originalMessage: error.originalError.message,
            stack: error.stack,
          }),
        },
        type: QueryTypes.UPDATE,
        transaction,
      },
    )

    if (rowCount !== 1) {
      throw new Error(`Failed to mark webhook '${id}' as error!`)
    }
  }

  async findPending(page: number, perPage: number): Promise<PendingWebhook[]> {
    const transaction = this.transaction

    const seq = this.seq

    const query = `
      select id, "tenantId"
      from "incomingWebhooks"
      where state = :pending
        and "createdAt" < now() - interval '1 hour'
      limit ${perPage} offset ${(page - 1) * perPage};
    `

    const results = await seq.query(query, {
      replacements: {
        pending: WebhookState.PENDING,
      },
      type: QueryTypes.SELECT,
      transaction,
    })

    return results as PendingWebhook[]
  }

  async cleanUpOldWebhooks(months: number): Promise<void> {
    const seq = this.seq

    const cleanQuery = `
        delete from "incomingWebhooks" where state = :processed and "processedAt" < now() - interval '${months} months';                     
    `

    await seq.query(cleanQuery, {
      replacements: {
        processed: WebhookState.PROCESSED,
      },
      type: QueryTypes.DELETE,
    })
  }
}
