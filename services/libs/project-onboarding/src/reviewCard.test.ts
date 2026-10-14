import { describe, expect, it } from 'vitest'

import { resolveReviewCase, resolveReviewCdpUrl, toReviewRequestCard } from './reviewCard'

const row = {
  id: 'catalog-1',
  repoName: 'kops',
  repoUrl: 'https://github.com/kubernetes/kops',
  projectName: 'Kubernetes',
  sourceUrl: 'https://lfx.slack.com/archives/C123/p1700000000000100',
  classificationKind: 'lf_in_cdp' as const,
  proposedAction: 'update_integration' as const,
  matchedProjectName: 'Kubernetes',
  matchedSegmentId: 'seg-1',
}

describe('toReviewRequestCard', () => {
  it('maps a catalog row to a card without enum values in the visible fields', () => {
    expect(toReviewRequestCard(row, null)).toEqual({
      id: 'catalog-1',
      repoName: 'kops',
      repoUrl: 'https://github.com/kubernetes/kops',
      sourceUrl: 'https://lfx.slack.com/archives/C123/p1700000000000100',
      requestedName: 'Kubernetes',
      matchedName: 'Kubernetes',
      insightsState: 'Project exists with GitHub connected',
      whatsNeeded: "Add this repo to Kubernetes's GitHub connection",
      mismatch: false,
      action: 'add_to_connection',
      cdpUrl: null,
      details: 'Details: lf_in_cdp · update_integration',
    })
  })

  it('flags a requested name that differs from the matched project', () => {
    const card = toReviewRequestCard({ ...row, projectName: 'Common Cloud Controls' }, null)

    expect(card.mismatch).toBe(true)
    expect(card.requestedName).toBe('Common Cloud Controls')
    expect(card.matchedName).toBe('Kubernetes')
  })

  it('ignores case and punctuation when comparing names and skips missing ones', () => {
    expect(toReviewRequestCard({ ...row, projectName: 'kubernetes!' }, null).mismatch).toBe(false)
    expect(toReviewRequestCard({ ...row, projectName: null }, null).mismatch).toBe(false)
    expect(
      toReviewRequestCard({ ...row, matchedProjectName: null, matchedSegmentId: null }, null)
        .mismatch,
    ).toBe(false)
  })

  it('builds a manual card with the CDP link for rows that need a person', () => {
    const card = toReviewRequestCard(
      { ...row, proposedAction: 'human_review' },
      'https://cdp.test/integrations/gp-1/seg-1',
    )

    expect(card).toMatchObject({
      insightsState: 'Uses the old GitHub connection',
      whatsNeeded: 'Add the repo by hand in CDP, then mark as done',
      action: 'manual',
      cdpUrl: 'https://cdp.test/integrations/gp-1/seg-1',
    })
  })
})

describe('resolveReviewCase', () => {
  it('picks the case from the proposed action, the kind and the matched segment', () => {
    expect(resolveReviewCase(row)).toBe('add_to_connection')
    expect(resolveReviewCase({ ...row, proposedAction: 'create_integration' })).toBe(
      'connect_github',
    )
    expect(resolveReviewCase({ ...row, proposedAction: 'human_review' })).toBe('legacy_connection')
    expect(
      resolveReviewCase({
        ...row,
        classificationKind: 'lf_not_in_cdp',
        proposedAction: 'human_review',
        matchedSegmentId: null,
      }),
    ).toBe('project_not_set_up')
    expect(
      resolveReviewCase({ ...row, proposedAction: 'human_review', matchedSegmentId: null }),
    ).toBe('owner_only_match')
    expect(resolveReviewCase({ ...row, proposedAction: null })).toBe('unknown')
  })
})

describe('resolveReviewCdpUrl', () => {
  const manual = { proposedAction: 'human_review' as const, matchedSegmentId: 'seg-1' }

  function qxWithSegments(rows: { id: string; grandparentId: string | null }[]) {
    return { select: async () => rows } as never
  }

  it('returns nothing without a frontend url or for rows handled automatically', async () => {
    expect(await resolveReviewCdpUrl(qxWithSegments([]), manual, undefined)).toBeNull()
    expect(
      await resolveReviewCdpUrl(
        qxWithSegments([]),
        { ...manual, proposedAction: 'update_integration' },
        'https://cdp.test',
      ),
    ).toBeNull()
  })

  it('links the matched sub-project page when its project group is known', async () => {
    expect(
      await resolveReviewCdpUrl(
        qxWithSegments([{ id: 'seg-1', grandparentId: 'gp-1' }]),
        manual,
        'https://cdp.test/',
      ),
    ).toBe('https://cdp.test/integrations/gp-1/seg-1')
  })

  it('falls back to the admin page without a matched segment or project group', async () => {
    expect(
      await resolveReviewCdpUrl(
        qxWithSegments([]),
        { ...manual, matchedSegmentId: null },
        'https://cdp.test',
      ),
    ).toBe('https://cdp.test/admin#project-groups')
    expect(
      await resolveReviewCdpUrl(
        qxWithSegments([{ id: 'seg-1', grandparentId: null }]),
        manual,
        'https://cdp.test',
      ),
    ).toBe('https://cdp.test/admin#project-groups')
  })
})
