import type Nango from '@nangohq/frontend' assert { 'resolution-mode': 'require' }
import type {
  Nango as BackendNango,
  SyncStatus,
} from '@nangohq/node' assert { 'resolution-mode': 'require' }

import { SERVICE } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'

import {
  INangoClientConfig,
  INangoCloudSessionToken,
  INangoResult,
  NANGO_INTEGRATION_CONFIG,
  NangoIntegration,
} from './types'
import { toRecord } from './utils'

const log = getServiceChildLogger('nango')

export type { SyncStatus } from '@nangohq/node' assert { 'resolution-mode': 'require' }

/* eslint-disable @typescript-eslint/no-explicit-any */

let backendClient: BackendNango | undefined = undefined

const DEFAULT_NANGO_FETCH_LIMIT = 100

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

function ensureBackendClient() {
  if (!backendClient) {
    throw new Error('Nango client not initialized')
  }
}

export const initNangoCloudClient = async (): Promise<void> => {
  if (!backendClient) {
    const config = NANGO_CLOUD_CONFIG()
    if (config) {
      log.info('Initializing Nango cloud client...')
      const backendModule = await import('@nangohq/node')
      backendClient = new backendModule.Nango({ secretKey: config.secretKey })
    } else {
      throw new Error('Nango cloud client env variables not set!')
    }
  }
}

export const getNangoCloudSessionToken = async (): Promise<INangoCloudSessionToken> => {
  ensureBackendClient()

  const service = `cm-${SERVICE}`

  const response = await backendClient.createConnectSession({
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

export const getNangoConnectionStatus = async (
  integration: NangoIntegration,
  connectionId: string,
): Promise<SyncStatus[]> => {
  ensureBackendClient()

  const res = await backendClient.syncStatus(integration, '*', connectionId)

  return res.syncs
}

export const getNangoConnectionIds = async (): Promise<
  { connectionId: string; integration: NangoIntegration; createdAt: string }[]
> => {
  ensureBackendClient()

  const results = await backendClient.listConnections()

  return results.connections.map((c) => {
    return {
      connectionId: c.connection_id,
      integration: c.provider_config_key as NangoIntegration,
      createdAt: c.created,
    }
  })
}

let frontendModule: any | undefined = undefined
export const connectNangoIntegration = async (
  integration: NangoIntegration,
  params: any,
): Promise<string> => {
  ensureBackendClient()

  log.info({ params, integration }, 'Creating a nango connection...')
  const data = await getNangoCloudSessionToken()

  if (!frontendModule) {
    frontendModule = await import('@nangohq/frontend')
  }

  const frontendClient = new frontendModule.default({
    connectSessionToken: data.token,
  }) as Nango

  const result = await frontendClient.auth(integration, params)
  return result.connectionId
}

export const createNangoIntegration = async (
  integration: NangoIntegration,
  params: any,
): Promise<string> => {
  ensureBackendClient()

  log.info({ params, integration }, 'Creating a nango connection...')

  const data = await getNangoCloudSessionToken()
  if (!frontendModule) {
    frontendModule = await import('@nangohq/frontend')
  }

  const frontendClient = new frontendModule.default({
    connectSessionToken: data.token,
  }) as Nango

  const result = await frontendClient.create(integration, params)
  return result.connectionId
}

export const setNangoMetadata = async (
  integration: NangoIntegration,
  connectionId: string,
  metadata: Record<string, unknown>,
): Promise<void> => {
  ensureBackendClient()

  await backendClient.setMetadata(integration, connectionId, metadata)
}

export const startNangoSync = async (
  integration: NangoIntegration,
  connectionId: string,
  syncs?: string[],
): Promise<void> => {
  ensureBackendClient()
  log.info({ connectionId, integration, syncs }, 'Starting a nango sync...')

  if (!syncs) {
    syncs = Object.values(NANGO_INTEGRATION_CONFIG[integration].syncs) as string[]
  } else {
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
  }

  await backendClient.startSync(integration, syncs, connectionId)
}

export const deleteNangoConnection = async (
  integration: NangoIntegration,
  connectionId: string,
): Promise<void> => {
  ensureBackendClient()

  await backendClient.deleteConnection(integration, connectionId)
}

export const getNangoCloudRecords = async (
  integration: NangoIntegration,
  connectionId: string,
  model: string,
  cursor?: string,
  limit?: number,
): Promise<INangoResult> => {
  ensureBackendClient()

  // verify model against config
  if (!(Object.values(NANGO_INTEGRATION_CONFIG[integration].models) as string[]).includes(model)) {
    const available = Object.values(NANGO_INTEGRATION_CONFIG[integration].models).join(', ')

    throw new Error(
      `Invalid model: ${model}! Integration '${integration}' supports these models: ${available}`,
    )
  }

  const result = await backendClient.listRecords({
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
