import { describe, expect, it } from 'vitest'

import { describeProposedAction, repoLabel, technicalDetails } from './botCopy'

describe('botCopy', () => {
  it('labels a GitHub repository with its owner/repo path', () => {
    expect(repoLabel('https://github.com/acme/widget')).toBe(
      '*<https://github.com/acme/widget|acme/widget>*',
    )
    expect(repoLabel('https://gitlab.com/acme/<widget>')).toBe(
      '*https://gitlab.com/acme/&lt;widget&gt;*',
    )
  })

  it('describes every proposed action in plain words', () => {
    expect(describeProposedAction('update_integration')).toBe(
      "Add this repo to the project's GitHub connection",
    )
    expect(describeProposedAction(null)).toBe('Nothing decided yet')
  })

  it('keeps the technical names in one details line', () => {
    expect(
      technicalDetails({ classificationKind: 'lf_in_cdp', proposedAction: 'update_integration' }),
    ).toBe('Details: lf_in_cdp · update_integration')
    expect(technicalDetails({ classificationKind: 'ambiguous', proposedAction: null })).toBe(
      'Details: ambiguous',
    )
    expect(technicalDetails({ classificationKind: null, proposedAction: null })).toBeNull()
  })
})
