import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IWebhookData } from './incomingWebhook.data'
import { WebhookState } from '@crowd/types'

export default class IncomingWebhookRepository extends RepositoryBase<IncomingWebhookRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async getWebhookById(id: string): Promise<IWebhookData> {
    const result = await this.db().oneOrNone(
      `
        select
            id,
            "tenantId",
            "integrationId",
            state,
            type,
            payload
        from 
            "incomingWebhooks"
        where
             id = $(id)
      `,
      {
        id,
      },
    )

    return result
  }

  public async markWebhookProcessed(id: string): Promise<void> {
    await this.db().none(
      `
        update "incomingWebhooks"
        set state = $(state)
        where id = $(id)
      `,
      {
        id,
        state: WebhookState.PROCESSED,
      },
    )
  }

  public async markWebhookError(id: string): Promise<void> {
    await this.db().none(
      `
        update "incomingWebhooks"
        set state = $(state)
        where id = $(id)
      `,
      {
        id,
        state: WebhookState.ERROR,
      },
    )
  }
}
