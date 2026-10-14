import { describe, expect, it } from 'vitest'

import type { Credential } from '../../types'
import { discoverOctolens, OCTOLENS_GLOBAL_CHANNEL_ID } from './discover'

const OCTOLENS_CREDENTIAL: Credential = {
  platform: 'octolens',
  kind: 'octolens-token',
  data: { token: 'test-token' },
}

describe('discoverOctolens', () => {
  it('returns a single global channel', async () => {
    const channels = await discoverOctolens(OCTOLENS_CREDENTIAL)

    expect(channels).toEqual([
      { channelId: OCTOLENS_GLOBAL_CHANNEL_ID, channelName: OCTOLENS_GLOBAL_CHANNEL_ID },
    ])
  })

  it('rejects a credential of the wrong kind', async () => {
    const githubCredential: Credential = {
      platform: 'github',
      kind: 'github-app',
      data: { appId: 'app', privateKey: 'key' },
    }

    await expect(discoverOctolens(githubCredential)).rejects.toThrow(
      'expected octolens-token credential, got github-app',
    )
  })
})
