import { describe, expect, it } from 'vitest'

import { ATTRIBUTES_MAX_BYTES, serializeAttributes, trimAttributeStrings } from './insert'

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

describe('serializeAttributes', () => {
  const bytes = (s: string) => Buffer.byteLength(s, 'utf8')

  it('leaves attributes under the cap unchanged apart from the per-string trim', () => {
    const attributes = {
      labels: Array.from({ length: 50 }, (_, i) => ({ name: `label-${i}`, color: 'ff0000' })),
      state: 'open',
      additions: 12,
      merged: false,
      missing: null,
      comment: 'x'.repeat(600),
    }

    expect(JSON.parse(serializeAttributes(attributes))).toEqual(trimAttributeStrings(attributes))
  })

  it('tightens the per-string limit before dropping anything', () => {
    // 60 strings of 500 chars ≈ 31 KB after the default trim, ≈ 12.5 KB at 200 chars
    const attributes = Object.fromEntries(
      Array.from({ length: 60 }, (_, i) => [`field${i}`, 'a'.repeat(1000)]),
    )

    const json = serializeAttributes(attributes)
    const parsed = JSON.parse(json) as Record<string, string>

    expect(bytes(json)).toBeLessThanOrEqual(ATTRIBUTES_MAX_BYTES)
    expect(Object.keys(parsed)).toEqual(Object.keys(attributes))
    expect(parsed.field0).toBe(`${'a'.repeat(200)}...`)
  })

  it('drops the largest top-level attributes first when shorter strings are not enough', () => {
    const attributes = {
      state: 'open',
      count: 3,
      bigNumbers: Array(5000).fill(123456),
      mediumNumbers: Array(1000).fill(1),
      small: { nested: ['x'.repeat(30)] },
    }

    const json = serializeAttributes(attributes)
    const parsed = JSON.parse(json)

    expect(bytes(json)).toBeLessThanOrEqual(ATTRIBUTES_MAX_BYTES)
    expect(parsed).toEqual({
      state: 'open',
      count: 3,
      mediumNumbers: attributes.mediumNumbers,
      small: { nested: ['x'.repeat(30)] },
    })
  })

  it('keeps nested objects and arrays intact, with strings trimmed, when shortening strings is enough', () => {
    const attributes = {
      review: Array.from({ length: 40 }, (_, i) => ({ id: i, text: 'r'.repeat(900), ok: true })),
      tags: Array.from({ length: 40 }, () => 't'.repeat(900)),
    }

    const json = serializeAttributes(attributes)
    const parsed = JSON.parse(json) as typeof attributes

    expect(bytes(json)).toBeLessThanOrEqual(ATTRIBUTES_MAX_BYTES)
    expect(parsed.review).toHaveLength(40)
    expect(parsed.review[0]).toEqual({ id: 0, text: `${'r'.repeat(100)}...`, ok: true })
    expect(parsed.tags).toHaveLength(40)
    expect(parsed.tags[0]).toBe(`${'t'.repeat(100)}...`)
  })

  it('measures the cap in UTF-8 bytes, not characters', () => {
    const attributes = Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [`k${i}`, 'é'.repeat(500)]),
    )

    const json = serializeAttributes(attributes)

    // 20 × 500 two-byte chars ≈ 20 KB, over the cap even though it is ~10k characters
    expect(bytes(json)).toBeLessThanOrEqual(ATTRIBUTES_MAX_BYTES)
    expect(Object.keys(JSON.parse(json))).toHaveLength(20)
  })

  it('is deterministic, including the tie-break between equally large attributes', () => {
    const build = (order: string[]) =>
      Object.fromEntries(order.map((k) => [k, Array(3000).fill(1)]))

    const a = serializeAttributes(build(['b', 'a', 'c']))
    const b = serializeAttributes(build(['b', 'a', 'c']))
    const reordered = JSON.parse(serializeAttributes(build(['c', 'b', 'a'])))

    expect(a).toBe(b)
    expect(bytes(a)).toBeLessThanOrEqual(ATTRIBUTES_MAX_BYTES)
    expect(Object.keys(JSON.parse(a)).sort()).toEqual(['b', 'c'])
    expect(Object.keys(reordered).sort()).toEqual(['b', 'c'])
  })
})
