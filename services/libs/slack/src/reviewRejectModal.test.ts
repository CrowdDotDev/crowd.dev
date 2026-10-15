import { describe, expect, it } from 'vitest'

import { formatSlackTime } from './mrkdwn'
import {
  REJECT_REVIEW_CALLBACK_ID,
  buildNotAllowedModal,
  buildRejectReviewModal,
  describeDecisionReason,
  parseRejectReviewSubmission,
} from './reviewRejectModal'

const prompt = {
  catalogId: '8f1c2a44-5b7e-4d2f-9c1a-3e6f7a8b9c0d',
  repoName: 'docsy <example>',
  responseUrl: 'https://hooks.slack.com/response',
}

function submission(values: Record<string, Record<string, unknown>>, overrides = {}) {
  return {
    callback_id: REJECT_REVIEW_CALLBACK_ID,
    private_metadata: JSON.stringify(prompt),
    state: { values },
    ...overrides,
  } as never
}

describe('buildRejectReviewModal', () => {
  it('carries the prompt in private metadata and lists every reason', () => {
    const view = buildRejectReviewModal(prompt)

    expect(view.callback_id).toBe(REJECT_REVIEW_CALLBACK_ID)
    expect(JSON.parse(view.private_metadata ?? '')).toEqual(prompt)
    expect(JSON.stringify(view.blocks)).toContain('Reject *docsy &lt;example&gt;*?')
    const rendered = JSON.stringify(view.blocks)
    for (const label of [
      'Not an LF project',
      'Wrong project',
      'Archived, fork or example repo',
      'Covered by another repo',
      'Other',
    ]) {
      expect(rendered).toContain(label)
    }
    expect(rendered).toContain('Note for the requester (optional)')
  })
})

describe('parseRejectReviewSubmission', () => {
  it('reads the reason and the trimmed note', () => {
    expect(
      parseRejectReviewSubmission(
        submission({
          reason: { decision_reason: { selected_option: { value: 'archived_or_fork' } } },
          note: { decision_note: { value: '  Example sites are not tracked.  ' } },
        }),
      ),
    ).toEqual({ ...prompt, reason: 'archived_or_fork', note: 'Example sites are not tracked.' })
  })

  it('leaves the note empty when it was not filled in', () => {
    expect(
      parseRejectReviewSubmission(
        submission({
          reason: { decision_reason: { selected_option: { value: 'other' } } },
          note: { decision_note: { value: null } },
        }),
      ),
    ).toMatchObject({ reason: 'other', note: null })
  })

  it('rejects other callbacks, unknown reasons and broken metadata', () => {
    const valid = { reason: { decision_reason: { selected_option: { value: 'other' } } } }

    expect(parseRejectReviewSubmission(submission(valid, { callback_id: 'x' }))).toBeNull()
    expect(
      parseRejectReviewSubmission(
        submission({ reason: { decision_reason: { selected_option: { value: 'nope' } } } }),
      ),
    ).toBeNull()
    expect(
      parseRejectReviewSubmission(submission(valid, { private_metadata: '{not json' })),
    ).toBeNull()
    expect(
      parseRejectReviewSubmission(submission(valid, { private_metadata: '{"catalogId":"1"}' })),
    ).toBeNull()
  })
})

describe('decision reasons and modals', () => {
  it('describes known reasons only', () => {
    expect(describeDecisionReason('wrong_project')).toBe('Wrong project')
    expect(describeDecisionReason('legacy')).toBeNull()
    expect(describeDecisionReason(null)).toBeNull()
  })

  it('builds the not-allowed modal with the team notice', () => {
    expect(JSON.stringify(buildNotAllowedModal().blocks)).toContain(
      'Only the CDP team can approve, reject or mark requests as done.',
    )
  })

  it('formats a time that Slack renders in the viewer timezone', () => {
    expect(formatSlackTime('2026-10-15T14:39:00.000Z')).toBe('<!date^1792075140^{time}|14:39 UTC>')
    expect(formatSlackTime('not a date')).toBe('an unknown time')
  })
})
