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
  const fitsCap = (json: string) => expect(bytes(json)).toBeLessThanOrEqual(ATTRIBUTES_MAX_BYTES)

  it('leaves attributes under the cap unchanged apart from the per-string trim', () => {
    const attributes = {
      labels: Array.from({ length: 50 }, (_, i) => ({ name: `label-${i}`, color: 'ff0000' })),
      state: 'open',
      additions: 12,
      merged: false,
      missing: null,
      comment: 'x'.repeat(600),
    }

    const { json, degradation } = serializeAttributes(attributes)

    expect(degradation).toBe('none')
    expect(JSON.parse(json)).toEqual(trimAttributeStrings(attributes))
  })

  it('tightens the per-string limit before pruning anything', () => {
    // 60 strings of 500 chars ≈ 31 KB after the default trim, ≈ 12.5 KB at 200 chars
    const attributes = Object.fromEntries(
      Array.from({ length: 60 }, (_, i) => [`field${i}`, 'a'.repeat(1000)]),
    )

    const { json, degradation } = serializeAttributes(attributes)
    const parsed = JSON.parse(json) as Record<string, string>

    fitsCap(json)
    expect(degradation).toBe('strings-shortened')
    expect(Object.keys(parsed)).toEqual(Object.keys(attributes))
    expect(parsed.field0).toBe(`${'a'.repeat(200)}...`)
  })

  it('keeps nested objects and arrays, with strings trimmed, when shortening strings is enough', () => {
    const attributes = {
      review: Array.from({ length: 40 }, (_, i) => ({ id: i, text: 'r'.repeat(900), ok: true })),
      tags: Array.from({ length: 40 }, () => 't'.repeat(900)),
    }

    const { json } = serializeAttributes(attributes)
    const parsed = JSON.parse(json) as typeof attributes

    fitsCap(json)
    expect(parsed.review).toHaveLength(40)
    expect(parsed.review[0]).toEqual({ id: 0, text: `${'r'.repeat(100)}...`, ok: true })
    expect(parsed.tags).toHaveLength(40)
    expect(parsed.tags[0]).toBe(`${'t'.repeat(100)}...`)
  })

  it('prunes the largest value from the inside and leaves smaller attributes alone', () => {
    const attributes = {
      state: 'open',
      count: 3,
      isIndirectFork: true,
      bigNumbers: Array(5000).fill(123456),
      mediumNumbers: Array(1000).fill(1),
      small: { nested: ['x'.repeat(30)] },
    }

    const { json, degradation } = serializeAttributes(attributes)
    const parsed = JSON.parse(json)

    fitsCap(json)
    expect(degradation).toBe('values-pruned')
    expect(parsed.bigNumbers.length).toBeGreaterThan(0)
    expect(parsed.bigNumbers.length).toBeLessThan(5000)
    expect(parsed.bigNumbers).toEqual(attributes.bigNumbers.slice(0, parsed.bigNumbers.length))
    expect(parsed).toEqual({ ...attributes, bigNumbers: parsed.bigNumbers })
  })

  it('shrinks a single nested value that alone exceeds the cap instead of wiping it', () => {
    const attributes = {
      payload: { items: Array.from({ length: 3000 }, (_, i) => ({ i })), note: 'n' },
    }

    const { json } = serializeAttributes(attributes)
    const parsed = JSON.parse(json)

    fitsCap(json)
    expect(parsed.payload.note).toBe('n')
    expect(parsed.payload.items.length).toBeGreaterThan(1000)
  })

  it('drops the largest strings first, ties by key, keeping small scalars', () => {
    // 400 strings × ~60 bytes even at the 50-character limit ≈ 24 KB
    const attributes: Record<string, unknown> = Object.fromEntries(
      Array.from({ length: 400 }, (_, i) => [`s${String(i).padStart(3, '0')}`, 's'.repeat(1000)]),
    )
    attributes.isIndirectFork = true

    const { json } = serializeAttributes(attributes)
    const parsed = JSON.parse(json)

    fitsCap(json)
    expect(parsed.isIndirectFork).toBe(true)
    expect(parsed.s000).toBeUndefined()
    expect(parsed.s399).toBe(`${'s'.repeat(50)}...`)
  })

  it('caps a top-level array', () => {
    const attributes = Array.from({ length: 3000 }, (_, i) => ({ id: i, name: `item-${i}` }))

    const { json } = serializeAttributes(attributes)
    const parsed = JSON.parse(json)

    fitsCap(json)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed.length).toBeGreaterThan(0)
    // equal-sized items are dropped from the end, so the head of the list survives in order
    expect(parsed[0]).toEqual({ id: 0, name: 'item-0' })
  })

  it('handles undefined, function and Date values like JSON.stringify does', () => {
    const date = new Date('2026-01-02T03:04:05.000Z')
    const attributes = {
      missing: undefined,
      fn: () => 1,
      when: date,
      list: [undefined, 1],
      big: Array(5000).fill(123456),
    }

    const small = JSON.parse(serializeAttributes({ when: date, list: [undefined, 1] }).json)
    const { json } = serializeAttributes(attributes)
    const parsed = JSON.parse(json)

    expect(small).toEqual({ when: date.toISOString(), list: [null, 1] })
    fitsCap(json)
    expect(parsed.when).toBe(date.toISOString())
    expect(parsed.list).toEqual([null, 1])
    expect('missing' in parsed || 'fn' in parsed).toBe(false)
  })

  it('measures the cap in UTF-8 bytes, not characters', () => {
    const attributes = Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [`k${i}`, 'é'.repeat(500)]),
    )

    const { json } = serializeAttributes(attributes)

    // 20 × 500 two-byte chars ≈ 20 KB, over the cap even though it is ~10k characters
    fitsCap(json)
    expect(Object.keys(JSON.parse(json))).toHaveLength(20)
  })

  it('is deterministic, independent of input key order', () => {
    const build = (order: string[]) =>
      Object.fromEntries(order.map((k) => [k, Array(3000).fill(1)]))

    const a = serializeAttributes(build(['b', 'a', 'c'])).json
    const b = serializeAttributes(build(['b', 'a', 'c'])).json
    const reordered = serializeAttributes(build(['c', 'b', 'a'])).json

    expect(a).toBe(b)
    fitsCap(a)
    expect(JSON.parse(reordered)).toEqual(JSON.parse(a))
    // equal sizes: the tie goes to the first key, so only `a` is shortened
    expect(JSON.parse(a).a.length).toBeLessThan(3000)
    expect(JSON.parse(a).b).toHaveLength(3000)
    expect(JSON.parse(a).c).toHaveLength(3000)
  })

  it('stays under the cap for randomly shaped oversized input', () => {
    let seed = 42
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }
    const gen = (depth: number): unknown => {
      const r = rand()
      if (depth > 2 || r < 0.3) return 'ü'.repeat(Math.floor(rand() * 800))
      if (r < 0.4) return Math.floor(rand() * 1e9)
      if (r < 0.7) return Array.from({ length: Math.floor(rand() * 40) }, () => gen(depth + 1))
      return Object.fromEntries(
        Array.from({ length: Math.floor(rand() * 40) }, (_, i) => [`key-${i}`, gen(depth + 1)]),
      )
    }

    for (let i = 0; i < 30; i++) {
      const { json } = serializeAttributes({ root: gen(0), other: gen(1) })
      fitsCap(json)
      expect(() => JSON.parse(json)).not.toThrow()
    }
  })
})
