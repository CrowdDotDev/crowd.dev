import { describe, expect, it } from 'vitest'

import { toReviewRequestCard } from './reviewCard'

describe('toReviewRequestCard', () => {
  it('maps a catalog row to a card without enum values in the visible fields', () => {
    expect(
      toReviewRequestCard({
        id: 'catalog-1',
        repoName: 'kops',
        repoUrl: 'https://github.com/kubernetes/kops',
        projectName: 'Kubernetes',
        sourceUrl: 'https://lfx.slack.com/archives/C123/p1700000000000100',
        reviewReason: 'Kubernetes is in LFX Insights, but this repo needs a quick check',
        classificationKind: 'lf_in_cdp',
        proposedAction: 'update_integration',
      }),
    ).toEqual({
      id: 'catalog-1',
      repoName: 'kops',
      repoUrl: 'https://github.com/kubernetes/kops',
      projectName: 'Kubernetes',
      sourceUrl: 'https://lfx.slack.com/archives/C123/p1700000000000100',
      reviewReason: 'Kubernetes is in LFX Insights, but this repo needs a quick check',
      whatsNeeded: "Add this repo to the project's GitHub connection",
      details: 'Details: lf_in_cdp · update_integration',
    })
  })
})
