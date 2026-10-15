import { beforeEach, describe, expect, it, vi } from 'vitest'

const queryInsightsProjects = vi.fn()
vi.mock('@crowd/data-access-layer/src/collections', () => ({
  InsightsProjectField: { NAME: 'name', SLUG: 'slug' },
  queryInsightsProjects: (...args: unknown[]) => queryInsightsProjects(...args),
}))

import { findOnboardedInsightsProject } from './onboardedProjectLookup'

const qx = {} as never

describe('findOnboardedInsightsProject', () => {
  beforeEach(() => {
    queryInsightsProjects.mockReset()
  })

  it('looks the project up by the segment that received the repository', async () => {
    queryInsightsProjects.mockResolvedValue([{ name: 'SLSA', slug: 'slsa' }])

    expect(await findOnboardedInsightsProject(qx, { matchedSegmentId: 'seg-1' })).toEqual({
      name: 'SLSA',
      slug: 'slsa',
    })
    expect(queryInsightsProjects).toHaveBeenCalledWith(qx, {
      filter: { segmentId: { eq: 'seg-1' } },
      fields: ['name', 'slug'],
      limit: 1,
    })
  })

  it('returns null without a segment, without a match or with an incomplete project', async () => {
    expect(await findOnboardedInsightsProject(qx, { matchedSegmentId: null })).toBeNull()
    expect(queryInsightsProjects).not.toHaveBeenCalled()

    queryInsightsProjects
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ name: null, slug: 'x' }])
    expect(await findOnboardedInsightsProject(qx, { matchedSegmentId: 'seg-1' })).toBeNull()
    expect(await findOnboardedInsightsProject(qx, { matchedSegmentId: 'seg-1' })).toBeNull()
  })
})
