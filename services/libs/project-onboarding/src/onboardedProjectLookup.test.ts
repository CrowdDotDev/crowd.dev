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

  it('looks the project up by the matched segment when there is one', async () => {
    queryInsightsProjects.mockResolvedValue([{ name: 'SLSA', slug: 'slsa' }])

    const project = await findOnboardedInsightsProject(qx, {
      projectSlug: 'slsa-framework-protos',
      matchedSegmentId: 'seg-1',
    })

    expect(project).toEqual({ name: 'SLSA', slug: 'slsa' })
    expect(queryInsightsProjects).toHaveBeenCalledWith(qx, {
      filter: { segmentId: { eq: 'seg-1' } },
      fields: ['name', 'slug'],
      limit: 1,
    })
  })

  it('falls back to the derived slug for a project created by the onboarding', async () => {
    queryInsightsProjects.mockResolvedValue([{ name: 'Acme Widget', slug: 'acme-widget' }])

    await findOnboardedInsightsProject(qx, { projectSlug: 'Acme Widget', matchedSegmentId: null })

    expect(queryInsightsProjects).toHaveBeenCalledWith(
      qx,
      expect.objectContaining({ filter: { slug: { eq: 'acme-widget' } } }),
    )
  })

  it('returns null when nothing matches or the row is incomplete', async () => {
    queryInsightsProjects
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ name: null, slug: 'x' }])

    expect(
      await findOnboardedInsightsProject(qx, { projectSlug: 'a', matchedSegmentId: null }),
    ).toBeNull()
    expect(
      await findOnboardedInsightsProject(qx, { projectSlug: 'a', matchedSegmentId: null }),
    ).toBeNull()
  })
})
