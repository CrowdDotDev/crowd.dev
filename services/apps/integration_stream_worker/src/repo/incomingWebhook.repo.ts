import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IWebhookData } from './incomingWebhook.data'

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
}
