import { describe, expect, it } from 'vitest'

import { PlatformType } from '@crowd/types'

import { resolveActivityResultPlatform } from './resolveActivityResultPlatform'

describe('resolveActivityResultPlatform', () => {
  it('prefers the activity platform over the integration platform when both are set', () => {
    expect(resolveActivityResultPlatform(PlatformType.OCTOLENS, PlatformType.REDDIT)).toBe(
      PlatformType.REDDIT,
    )
  })

  it('falls back to the integration platform when the activity has none', () => {
    expect(resolveActivityResultPlatform(PlatformType.GITHUB, undefined)).toBe(PlatformType.GITHUB)
  })

  it('normalizes github-nango to github after resolving', () => {
    expect(resolveActivityResultPlatform(PlatformType.GITHUB_NANGO, undefined)).toBe(
      PlatformType.GITHUB,
    )
  })

  it('normalizes an activity-provided github-nango to github too', () => {
    expect(resolveActivityResultPlatform(null, PlatformType.GITHUB_NANGO)).toBe(PlatformType.GITHUB)
  })
})
