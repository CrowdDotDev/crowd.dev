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

  it('routes any purl type outside the map to llm repo resolution', () => {
    expect(collectionPathForPurlType('hackage')).toBe('llm_repo_resolution')
    expect(collectionPathForPurlType('conan')).toBe('llm_repo_resolution')
    expect(collectionPathForPurlType('hasOwnProperty')).toBe('llm_repo_resolution')
  })
})
