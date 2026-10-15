import { describe, expect, it } from 'vitest'

import {
  MEMBER_CONTRIBUTOR_COLLECTION_PATHS,
  collectionPathForEcosystem,
  purlEcosystem,
} from './memberContributorCollectionPaths'

describe('purlEcosystem', () => {
  it('returns the lowercased purl type', () => {
    expect(purlEcosystem('pkg:npm/express')).toBe('npm')
    expect(purlEcosystem('pkg:NPM/%40babel/core')).toBe('npm')
    expect(purlEcosystem('pkg:maven/org.jboss.logging/commons-logging-jboss-logging')).toBe('maven')
  })

  it('returns an empty string when the purl has no type segment', () => {
    expect(purlEcosystem('pkg:')).toBe('')
    expect(purlEcosystem('pkg:/x')).toBe('')
  })
})

describe('collectionPathForEcosystem', () => {
  it('maps every collected ecosystem to the github path', () => {
    for (const ecosystem of [
      'npm',
      'maven',
      'pypi',
      'cargo',
      'go',
      'nuget',
      'packagist',
      'rubygems',
    ]) {
      expect(collectionPathForEcosystem(ecosystem)).toBe('github')
    }
    expect(Object.keys(MEMBER_CONTRIBUTOR_COLLECTION_PATHS)).toHaveLength(8)
  })

  it('returns null for ecosystems we do not collect', () => {
    expect(collectionPathForEcosystem('hackage')).toBeNull()
    expect(collectionPathForEcosystem('conan')).toBeNull()
    expect(collectionPathForEcosystem('')).toBeNull()
    expect(collectionPathForEcosystem('constructor')).toBeNull()
  })
})
