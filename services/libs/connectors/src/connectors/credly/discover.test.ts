import { describe, expect, it } from 'vitest'

import type { Credential } from '../../types'
import { discoverCredly } from './discover'
import { credlyConnector } from './index'

describe('discoverCredly', () => {
  it('returns the organization as the only channel', async () => {
    const credential: Credential = {
      platform: 'credly',
      kind: 'credly-oauth-client',
      data: { clientId: 'id', clientSecret: 'secret', organizationId: 'org-1' },
    }

    await expect(discoverCredly(credential)).resolves.toEqual([
      { channelId: 'org-1', channelName: 'org-1' },
    ])
  })

  it('rejects a credential of another kind', async () => {
    const credential: Credential = {
      platform: 'octolens',
      kind: 'octolens-token',
      data: { token: 'token' },
    }

    await expect(discoverCredly(credential)).rejects.toThrow(
      'expected credly-oauth-client credential, got octolens-token',
    )
  })
})

describe('credlyConnector', () => {
  it('registers the credly platform with the pool hooks and no sync yet', () => {
    expect(credlyConnector.platform).toBe('credly')
    expect(credlyConnector.syncs).toEqual([])
    expect(credlyConnector.preparePool).toBeTypeOf('function')
    expect(credlyConnector.mintToken).toBeTypeOf('function')
    expect(credlyConnector.emitsOwnSegment).toBeUndefined()
  })
})
