import axios, { AxiosError } from 'axios'

import { summarizeBody } from '../../http/client'
import { ConnectorError, ProviderContractError, errorFromHttpStatus } from '../../http/errors'
import type { TokenMinter, TokenPool } from '../../pool/tokenPool'
import { assertCredentialKind } from '../../types'
import type { Credential, PoolPreparation } from '../../types'

export const CREDLY_OAUTH_TOKEN_URL = 'https://api.credly.com/oauth/token'
export const CREDLY_OAUTH_SCOPE = 'issued_badges badge_templates'
export const CREDLY_POOL_ENTRY_ID = 'credly-org'
export const CREDLY_REQUEST_TIMEOUT_MS = 30_000

interface OAuthTokenPayload {
  access_token?: unknown
  expires_in?: unknown
}

export async function mintCredlyAccessToken(
  credential: Credential,
): Promise<{ token: string; expiresAt: string }> {
  assertCredentialKind(credential, 'credly-oauth-client')
  const form = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: credential.data.clientId,
    client_secret: credential.data.clientSecret,
    scope: CREDLY_OAUTH_SCOPE,
  })
  const mintedAtMs = Date.now()
  let payload: OAuthTokenPayload
  try {
    const response = await axios.post<OAuthTokenPayload>(CREDLY_OAUTH_TOKEN_URL, form.toString(), {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: CREDLY_REQUEST_TIMEOUT_MS,
    })
    payload = response.data
  } catch (err) {
    throw classifyTokenError(err) ?? err
  }

  const token = payload?.access_token
  const expiresIn = payload?.expires_in
  if (typeof token !== 'string' || token === '' || !isPositiveNumber(expiresIn)) {
    throw new ProviderContractError(
      'credly oauth token response has no usable access_token or expires_in',
    ).withContext({
      request: { method: 'POST', url: CREDLY_OAUTH_TOKEN_URL },
      response: { status: 200, body: summarizeBody(withoutToken(payload)) },
    })
  }
  return { token, expiresAt: new Date(mintedAtMs + expiresIn * 1000).toISOString() }
}

export async function prepareCredlyPool(
  credential: Credential,
  pool: TokenPool,
): Promise<PoolPreparation> {
  assertCredentialKind(credential, 'credly-oauth-client')
  await pool.seed([CREDLY_POOL_ENTRY_ID])
  return { preferredEntryId: CREDLY_POOL_ENTRY_ID }
}

export function createCredlyTokenMinter(credential: Credential): TokenMinter {
  assertCredentialKind(credential, 'credly-oauth-client')
  return () => mintCredlyAccessToken(credential)
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function classifyTokenError(err: unknown): ConnectorError | null {
  if (!axios.isAxiosError(err)) {
    return null
  }
  const status = err.response?.status
  const body = err.response?.data as { error?: string; error_description?: string } | undefined
  const detail = body?.error_description ?? body?.error ?? err.message
  const statusLabel = status === undefined ? 'no response' : `status ${status}`
  return errorFromHttpStatus(
    status,
    `credly oauth token request failed (${statusLabel}): ${detail}`,
    {
      cause: causeWithoutSecrets(err),
    },
  ).withContext({
    request: { method: 'POST', url: CREDLY_OAUTH_TOKEN_URL },
    response:
      status === undefined ? undefined : { status, body: summarizeBody(withoutToken(body)) },
  })
}

function causeWithoutSecrets(err: AxiosError): { code?: string; message: string } {
  return { code: err.code, message: err.message }
}

function withoutToken(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload
  const { access_token: _, refresh_token: __, ...rest } = payload as Record<string, unknown>
  return rest
}
