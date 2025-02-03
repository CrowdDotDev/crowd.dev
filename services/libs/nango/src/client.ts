import type { Nango } from '@nangohq/node' assert { 'resolution-mode': 'require' }

import { SERVICE } from '@crowd/common'

import {
  INangoClientConfig,
  INangoCloudSessionToken,
  INangoResult,
  NANGO_INTEGRATION_CONFIG,
  NangoIntegration,
} from './types'
import { toRecord } from './utils'

let client: Nango | undefined = undefined

const DEFAULT_NANGO_FETCH_LIMIT = 20

let config: INangoClientConfig | undefined | null = undefined
export const NANGO_CLOUD_CONFIG = () => {
  if (!config && config !== null) {
    if (process.env.NANGO_CLOUD_SECRET_KEY) {
      config = {
        secretKey: process.env.NANGO_CLOUD_SECRET_KEY,
        integrations: process.env.NANGO_CLOUD_INTEGRATIONS.split(','),
      }
    } else {
      config = null
    }
  }

  return config
}

function ensureClient() {
  if (!client) {
    throw new Error('Nango client not initialized')
  }
}

export const getNangoCloudClient = () => {
  ensureClient()
  return client
}

export const initNangoCloudClient = async (): Promise<Nango> => {
  if (!client) {
    const config = NANGO_CLOUD_CONFIG()
    if (!config) {
      const module = await import('@nangohq/node')
      client = new module.Nango({ secretKey: config.secretKey })
    } else {
      throw new Error('Nango cloud client env variables not set!')
    }
  }

  return client
}

export const getNangoCloudSessionToken = async (): Promise<INangoCloudSessionToken> => {
  ensureClient()

  const service = `cm-${SERVICE}`
  const response = await client.createConnectSession({
    end_user: {
      id: service,
    },
    allowed_integrations: NANGO_CLOUD_CONFIG().integrations,
  })

  return {
    token: response.data.token,
    expiresAt: response.data.expires_at,
  }
}

export const startSync = async (
  integration: NangoIntegration,
  connectionId: string,
  syncs: string[],
): Promise<void> => {
  ensureClient()

  // verify against config
  const validSyncs = Object.values(NANGO_INTEGRATION_CONFIG[integration].syncs) as string[]
  for (const sync of syncs) {
    if (!validSyncs.includes(sync)) {
      const available = validSyncs.join(', ')

      throw new Error(
        `Invalid sync: ${sync}! Integration '${integration}' supports these syncs: ${available}`,
      )
    }
  }

  await client.startSync(integration, syncs, connectionId)
}

export const getNangoCloudRecords = async (
  integration: NangoIntegration,
  connectionId: string,
  model: string,
  cursor?: string,
  limit?: number,
): Promise<INangoResult> => {
  ensureClient()

  // verify model against config
  if (!(Object.values(NANGO_INTEGRATION_CONFIG[integration].models) as string[]).includes(model)) {
    const available = Object.values(NANGO_INTEGRATION_CONFIG[integration].models).join(', ')

    throw new Error(
      `Invalid model: ${model}! Integration '${integration}' supports these models: ${available}`,
    )
  }

  const result = await client.listRecords({
    providerConfigKey: integration,
    connectionId,
    model,
    limit: limit ?? DEFAULT_NANGO_FETCH_LIMIT,
    cursor,
  })

  const records = result.records.map(toRecord)

  return {
    records,
    nextCursor: result.next_cursor,
  }
}
