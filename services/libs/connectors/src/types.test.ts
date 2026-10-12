import { describe, expect, it } from 'vitest'

import { assertCredentialKind } from './types'
import type { Credential } from './types'

const GITHUB_CREDENTIAL: Credential = {
  platform: 'github',
  kind: 'github-app',
  data: { appId: 'app', privateKey: 'key' },
}

describe('assertCredentialKind', () => {
  it('does not throw when the credential already has the expected kind', () => {
    expect(() => assertCredentialKind(GITHUB_CREDENTIAL, 'github-app')).not.toThrow()
  })

  it('throws when the credential has a different kind', () => {
    expect(() => assertCredentialKind(GITHUB_CREDENTIAL, 'octolens-token')).toThrow(
      'expected octolens-token credential, got github-app',
    )
  })
})
