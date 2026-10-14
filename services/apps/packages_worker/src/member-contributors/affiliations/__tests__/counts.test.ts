import { describe, expect, it } from 'vitest'

import { addChunkCounts, emptyChunkCounts } from '../counts'

describe('addChunkCounts', () => {
  it('adds every method count', () => {
    const page = { cdp: 1, email_domain: 2, github_company: 3, unresolved: 4 }
    expect(addChunkCounts(addChunkCounts(emptyChunkCounts(), page), page)).toEqual({
      cdp: 2,
      email_domain: 4,
      github_company: 6,
      unresolved: 8,
    })
  })
})
