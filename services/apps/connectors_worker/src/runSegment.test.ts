import { describe, expect, it } from 'vitest'

import { resolveRunSegmentId } from './runSegment'

const MISSING_SEGMENT = 'integration integration-1 not found or has no segmentId'
const FLAGGED = { emitsOwnSegment: true }
const UNFLAGGED = {}

describe('resolveRunSegmentId', () => {
  it('returns the integration segment whether or not the connector is flagged', () => {
    expect(resolveRunSegmentId('integration-1', { segmentId: 'segment-1' }, UNFLAGGED)).toBe(
      'segment-1',
    )
    expect(resolveRunSegmentId('integration-1', { segmentId: 'segment-1' }, FLAGGED)).toBe(
      'segment-1',
    )
  })

  it('runs a segment-less integration when the connector sets every emit segment', () => {
    expect(resolveRunSegmentId('integration-1', { segmentId: null }, FLAGGED)).toBeNull()
  })

  it('still refuses a segment-less integration for connectors without the flag', () => {
    expect(() => resolveRunSegmentId('integration-1', { segmentId: null }, UNFLAGGED)).toThrow(
      MISSING_SEGMENT,
    )
    expect(() =>
      resolveRunSegmentId('integration-1', { segmentId: null }, { emitsOwnSegment: false }),
    ).toThrow(MISSING_SEGMENT)
  })

  it('refuses a missing integration even when the connector is flagged', () => {
    expect(() => resolveRunSegmentId('integration-1', null, FLAGGED)).toThrow(MISSING_SEGMENT)
    expect(() => resolveRunSegmentId('integration-1', null, UNFLAGGED)).toThrow(MISSING_SEGMENT)
  })
})
