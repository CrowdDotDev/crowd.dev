import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProviderContractError, RateLimitError } from '../../http/errors'
import { fetchFeeds, fetchKeywords, fetchNotifications } from './configClient'

vi.mock('axios')
vi.mock('@crowd/common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@crowd/common')>()),
  timeout: vi.fn().mockResolvedValue(undefined),
}))

const mockedGet = vi.mocked(axios.get)

beforeEach(() => {
  mockedGet.mockReset()
})

describe('octolens config client', () => {
  it.each([
    ['notifications', fetchNotifications],
    ['feeds', fetchFeeds],
    ['keywords', fetchKeywords],
  ] as const)('GETs /%s with the bearer token and returns its data', async (path, fetch) => {
    mockedGet.mockResolvedValue({ status: 200, headers: {}, data: { data: [{ id: 1 }] } })

    expect(await fetch('test-token')).toEqual([{ id: 1 }])
    expect(mockedGet).toHaveBeenCalledWith(
      `https://app.octolens.com/api/v2/${path}`,
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }),
    )
  })

  it('throws a contract error when the response has no data array', async () => {
    mockedGet.mockResolvedValue({ status: 200, headers: {}, data: { items: [] } })

    await expect(fetchFeeds('test-token')).rejects.toBeInstanceOf(ProviderContractError)
  })

  it('throws a RateLimitError on a 429 without retrying', async () => {
    mockedGet.mockResolvedValue({ status: 429, headers: { 'retry-after': '120' }, data: {} })

    await expect(fetchNotifications('test-token')).rejects.toBeInstanceOf(RateLimitError)
    expect(mockedGet).toHaveBeenCalledTimes(1)
  })

  it('retries a 5xx response and succeeds once a later attempt returns 200', async () => {
    mockedGet
      .mockResolvedValueOnce({ status: 503, headers: {}, data: {} })
      .mockResolvedValueOnce({ status: 200, headers: {}, data: { data: [] } })

    expect(await fetchKeywords('test-token')).toEqual([])
    expect(mockedGet).toHaveBeenCalledTimes(2)
  })
})
