import { describe, expect, it } from 'vitest'

import { trimAttributeStrings, tryToUnwrapAttributes } from './insert'

describe('trimAttributeStrings', () => {
  it('keeps every key of an oversized attributes object instead of wiping it', () => {
    const attributes = {
      labels: Array.from({ length: 50 }, (_, i) => ({ name: `label-${i}`, color: 'ff0000' })),
      state: 'open',
      additions: 12,
      merged: false,
    }

    expect(trimAttributeStrings(attributes)).toEqual(attributes)
  })

  it('trims a long string value to 500 characters plus an ellipsis', () => {
    const trimmed = trimAttributeStrings({ comment: 'x'.repeat(2000) }) as { comment: string }

    expect(trimmed.comment).toBe(`${'x'.repeat(500)}...`)
  })

  it('trims strings inside nested objects and arrays', () => {
    const trimmed = trimAttributeStrings({
      review: { response: 'y'.repeat(800), rating: 4 },
      tags: ['short', 'z'.repeat(800)],
    }) as { review: { response: string; rating: number }; tags: string[] }

    expect(trimmed.review.response).toHaveLength(503)
    expect(trimmed.review.rating).toBe(4)
    expect(trimmed.tags[0]).toBe('short')
    expect(trimmed.tags[1]).toHaveLength(503)
  })

  it('leaves numbers, booleans, nulls and array lengths untouched', () => {
    const attributes = { count: 7, flag: true, missing: null, list: Array(1000).fill(1) }

    expect(trimAttributeStrings(attributes)).toEqual(attributes)
  })

  it('does not split a surrogate pair at the cut point', () => {
    const value = `${'a'.repeat(499)}😀tail`

    const trimmed = (trimAttributeStrings({ v: value }) as { v: string }).v

    expect(trimmed).toBe(`${'a'.repeat(499)}...`)
  })
})

describe('tryToUnwrapAttributes', () => {
  it('returns an object as is', () => {
    const attributes = { url: 'https://example.com' }
    expect(tryToUnwrapAttributes(attributes)).toBe(attributes)
  })

  it('unwraps attributes encoded as JSON, also when encoded more than once', () => {
    const attributes = { state: 'open' }
    expect(tryToUnwrapAttributes(JSON.stringify(attributes))).toEqual(attributes)
    expect(tryToUnwrapAttributes(JSON.stringify(JSON.stringify(attributes)))).toEqual(attributes)
  })

  it.each(['5', 'true', 'null', JSON.stringify('5')])(
    'returns empty attributes for %s instead of looping forever',
    (encoded) => {
      expect(tryToUnwrapAttributes(encoded)).toEqual({})
    },
  )
})
