import { DbColumnSet, DbInstance } from '@crowd/database'
import { IntegrationRunState, IntegrationState, IntegrationStreamState } from '@crowd/types'

export interface IStreamData {
  onboarding: boolean | null
  integrationId: string
  integrationType: string
  integrationState: IntegrationState
  integrationIdentifier: string | null
  integrationToken: string | null
  integrationRefreshToken: string | null
  runState: IntegrationRunState | null
  webhookId: string | null
  runId: string | null
  tenantId: string
  integrationSettings: unknown

  id: string
  state: IntegrationStreamState
  parentId: string | null
  identifier: string
  data: unknown
  retries: number
}

export interface IProcessableStream {
  id: string
  tenantId: string
  integrationType: string
  runId: string | null
  webhookId: string | null
}

export interface IInsertableWebhookStream {
  identifier: string
  webhookId: string
  data: unknown
  integrationId: string
  tenantId: string
}

let insertWebhookStreamColumnSet: DbColumnSet
export function getInsertWebhookStreamColumnSet(instance: DbInstance): DbColumnSet {
  if (insertWebhookStreamColumnSet) return insertWebhookStreamColumnSet

  insertWebhookStreamColumnSet = new instance.helpers.ColumnSet(
    ['webhookId', 'state', 'identifier', 'data', 'tenantId', 'integrationId'],
    {
      table: {
        table: 'streams',
        schema: 'integration',
      },
    },
  )

  return insertWebhookStreamColumnSet
}
