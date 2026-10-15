import { describe, expect, it } from 'vitest'

import {
  MEMBER_CONTRIBUTOR_COLLECTION_PATHS,
  collectionPathForPurlType,
  purlType,
} from './memberContributorCollectionPaths'

describe('purlType', () => {
  it('returns the lowercased purl type', () => {
    expect(purlType('pkg:npm/express')).toBe('npm')
    expect(purlType('pkg:NPM/%40babel/core')).toBe('npm')
    expect(purlType('pkg:golang/github.com/x/y')).toBe('golang')
    expect(purlType('pkg:maven/org.jboss.logging/commons-logging-jboss-logging')).toBe('maven')
  })

  it('returns an empty string when the purl has no type segment', () => {
    expect(purlType('pkg:')).toBe('')
    expect(purlType('pkg:/x')).toBe('')
  })
})

describe('collectionPathForPurlType', () => {
  it('maps every collected purl type to the github path', () => {
    for (const type of ['npm', 'maven', 'pypi', 'cargo', 'golang', 'nuget', 'composer', 'gem']) {
      expect(collectionPathForPurlType(type)).toBe('github')
    }
    expect(Object.keys(MEMBER_CONTRIBUTOR_COLLECTION_PATHS)).toHaveLength(8)
  })

  it('returns null for purl types we do not collect', () => {
    expect(collectionPathForPurlType('hackage')).toBeNull()
    expect(collectionPathForPurlType('conan')).toBeNull()
    expect(collectionPathForPurlType('')).toBeNull()
    expect(collectionPathForPurlType('constructor')).toBeNull()
    expect(collectionPathForPurlType('go')).toBeNull()
    expect(collectionPathForPurlType('packagist')).toBeNull()
    expect(collectionPathForPurlType('rubygems')).toBeNull()
  })
})
