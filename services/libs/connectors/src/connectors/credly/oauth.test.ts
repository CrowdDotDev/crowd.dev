import axios from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ProviderAuthError,
  ProviderContractError,
  ProviderUnavailableError,
  RateLimitError,
} from '../../http/errors'
import type { TokenPool } from '../../pool/tokenPool'
import type { Credential } from '../../types'
import {
  CREDLY_OAUTH_TOKEN_URL,
  CREDLY_POOL_ENTRY_ID,
  createCredlyTokenMinter,
  mintCredlyAccessToken,
  prepareCredlyPool,
} from './oauth'

const mockedPost = vi.spyOn(axios, 'post')

const CREDENTIAL: Credential = {
  platform: 'credly',
  kind: 'credly-oauth-client',
  data: { clientId: 'client-id', clientSecret: 'client-secret', organizationId: 'org-id' },
}

const OCTOLENS_CREDENTIAL: Credential = {
  platform: 'octolens',
  kind: 'octolens-token',
  data: { token: 'octolens-token' },
}

function axiosFailure(status: number | undefined, data?: unknown): Error {
  const err = new axios.AxiosError('request failed', undefined, undefined, undefined, undefined)
  if (status !== undefined) {
    err.response = { status, data, headers: {}, config: {} as never, statusText: '' }
  }
  return err
}

beforeEach(() => {
  mockedPost.mockReset()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-22T10:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('mintCredlyAccessToken', () => {
  it('posts the client credentials as a form and derives expiresAt from expires_in', async () => {
    mockedPost.mockResolvedValue({
      status: 200,
      data: { access_token: 'access-token', token_type: 'Bearer', expires_in: 7200 },
    })

    const minted = await mintCredlyAccessToken(CREDENTIAL)

    expect(minted).toEqual({ token: 'access-token', expiresAt: '2026-10-22T12:00:00.000Z' })
    expect(mockedPost).toHaveBeenCalledWith(
      CREDLY_OAUTH_TOKEN_URL,
      'grant_type=client_credentials&client_id=client-id&client_secret=client-secret&scope=issued_badges+badge_templates',
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    )
  })

  it('rejects a credential of the wrong kind before calling credly', async () => {
    await expect(mintCredlyAccessToken(OCTOLENS_CREDENTIAL)).rejects.toThrow(
      'expected credly-oauth-client credential, got octolens-token',
    )
    expect(mockedPost).not.toHaveBeenCalled()
  })

  it('maps 401 to ProviderAuthError without the secret in the message or options', async () => {
    mockedPost.mockRejectedValue(axiosFailure(401, { error: 'invalid_client' }))

    const failure = await mintCredlyAccessToken(CREDENTIAL).catch((err) => err)

    expect(failure).toBeInstanceOf(ProviderAuthError)
    expect(failure.message).toBe('credly oauth token request failed (status 401): invalid_client')
    expect(failure.message).not.toContain('client-secret')
    expect(JSON.stringify(failure.options)).not.toContain('client-secret')
  })

  it('maps 429 to RateLimitError so the pool does not quarantine the entry', async () => {
    mockedPost.mockRejectedValue(axiosFailure(429, { error: 'rate_limited' }))

    await expect(mintCredlyAccessToken(CREDENTIAL)).rejects.toBeInstanceOf(RateLimitError)
  })

  it('maps 5xx and network failures to ProviderUnavailableError', async () => {
    mockedPost.mockRejectedValueOnce(axiosFailure(503))
    await expect(mintCredlyAccessToken(CREDENTIAL)).rejects.toBeInstanceOf(ProviderUnavailableError)

    mockedPost.mockRejectedValueOnce(axiosFailure(undefined))
    await expect(mintCredlyAccessToken(CREDENTIAL)).rejects.toBeInstanceOf(ProviderUnavailableError)
  })

  it('maps other 4xx to ProviderContractError', async () => {
    mockedPost.mockRejectedValue(axiosFailure(400, { error: 'invalid_scope' }))

    await expect(mintCredlyAccessToken(CREDENTIAL)).rejects.toBeInstanceOf(ProviderContractError)
  })

  it.each([0, -1, '7200', true, [7200], undefined])(
    'rejects a 200 whose expires_in is %j',
    async (expiresIn) => {
      mockedPost.mockResolvedValue({
        status: 200,
        data: { access_token: 'x', expires_in: expiresIn },
      })

      const failure = await mintCredlyAccessToken(CREDENTIAL).catch((err) => err)

      expect(failure).toBeInstanceOf(ProviderContractError)
      expect(JSON.stringify(failure.options)).not.toContain('"x"')
    },
  )
  it('drops a non-object body from the error context instead of copying its raw text', async () => {
    mockedPost.mockResolvedValue({ status: 200, data: '{"access_token":"leaked-tok' })

    const failure = await mintCredlyAccessToken(CREDENTIAL).catch((err) => err)

    expect(failure).toBeInstanceOf(ProviderContractError)
    expect(JSON.stringify(failure.options)).not.toContain('leaked-tok')
  })
})

describe('prepareCredlyPool', () => {
  function fakePool(): TokenPool & { seed: ReturnType<typeof vi.fn> } {
    return {
      seed: vi.fn().mockResolvedValue(undefined),
    } as unknown as TokenPool & { seed: ReturnType<typeof vi.fn> }
  }

  it('seeds the single org entry and prefers it', async () => {
    const pool = fakePool()

    const preparation = await prepareCredlyPool(CREDENTIAL, pool)

    expect(pool.seed).toHaveBeenCalledWith([CREDLY_POOL_ENTRY_ID])
    expect(preparation).toEqual({ preferredEntryId: CREDLY_POOL_ENTRY_ID })
  })

  it('rejects a credential of the wrong kind before touching the pool', async () => {
    const pool = fakePool()

    await expect(prepareCredlyPool(OCTOLENS_CREDENTIAL, pool)).rejects.toThrow(
      'expected credly-oauth-client credential, got octolens-token',
    )
    expect(pool.seed).not.toHaveBeenCalled()
  })
})

describe('createCredlyTokenMinter', () => {
  it('mints the same org token whatever entry id the pool asks for', async () => {
    mockedPost.mockResolvedValue({
      status: 200,
      data: { access_token: 'access-token', expires_in: 7200 },
    })

    const minted = await createCredlyTokenMinter(CREDENTIAL)('any-entry')

    expect(minted.token).toBe('access-token')
  })
})
