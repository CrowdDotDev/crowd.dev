import { describe, expect, it } from 'vitest'

import type { Credential } from '../../types'
import { mintInstallationToken } from './appToken'

describe('mintInstallationToken', () => {
  it('rejects a credential of the wrong kind', async () => {
    const octolensCredential: Credential = {
      platform: 'octolens',
      kind: 'octolens-token',
      data: { token: 'test-token' },
    }

    await expect(mintInstallationToken(octolensCredential, 'installation-1')).rejects.toThrow(
      'expected github-app credential, got octolens-token',
    )
  })
})
