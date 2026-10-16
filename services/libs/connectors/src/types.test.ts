import { describe, expect, it } from 'vitest'

import { assertCredentialKind } from './types'
import type { AnyManifest, Credential, Manifest } from './types'

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

describe('Manifest deps contract', () => {
  it('requires createDeps when a manifest declares deps', () => {
    // @ts-expect-error a manifest whose syncs need deps must provide the factory
    const manifest: Manifest<{ lookup: () => string }> = {
      platform: 'example',
      syncs: [],
      discover: async () => [],
    }

    expect(manifest.platform).toBe('example')
  })

  it('accepts emitsOwnSegment alongside createDeps and on AnyManifest', () => {
    const manifest: Manifest<{ lookup: () => string }> = {
      platform: 'example',
      syncs: [],
      discover: async () => [],
      createDeps: () => ({ lookup: () => 'x' }),
      emitsOwnSegment: true,
    }
    const anyManifest: AnyManifest = manifest

    expect(anyManifest.emitsOwnSegment).toBe(true)
  })

  it('leaves createDeps optional for a manifest without deps', () => {
    const manifest: Manifest = { platform: 'example', syncs: [], discover: async () => [] }

    expect(manifest.createDeps).toBeUndefined()
  })
})
