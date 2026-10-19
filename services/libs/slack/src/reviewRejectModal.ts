import type { View } from '@slack/web-api'

import { escapeSlackText } from './mrkdwn'

export const REJECT_REVIEW_CALLBACK_ID = 'reject_review_modal'
export const NOT_ALLOWED_CALLBACK_ID = 'review_not_allowed_modal'

export const DECISION_REASONS = [
  'not_lf_project',
  'wrong_project',
  'archived_or_fork',
  'covered_by_other_repo',
  'other',
] as const

export type DecisionReason = (typeof DECISION_REASONS)[number]

export const DECISION_REASON_LABELS: Record<DecisionReason, string> = {
  not_lf_project: 'Not an LF project',
  wrong_project: 'Wrong project',
  archived_or_fork: 'Archived, fork or example repo',
  covered_by_other_repo: 'Covered by another repo',
  other: 'Other',
}

export function describeDecisionReason(reason: string | null): string | null {
  return isDecisionReason(reason) ? DECISION_REASON_LABELS[reason] : null
}

export function isDecisionReason(value: unknown): value is DecisionReason {
  return typeof value === 'string' && (DECISION_REASONS as readonly string[]).includes(value)
}

const REASON_BLOCK_ID = 'reason'
const REASON_ACTION_ID = 'decision_reason'
const NOTE_BLOCK_ID = 'note'
const NOTE_ACTION_ID = 'decision_note'
const MAX_NOTE_LENGTH = 300

export interface IRejectReviewPrompt {
  catalogId: string
  repoName: string
  responseUrl: string
}

export interface IRejectReviewSubmission extends IRejectReviewPrompt {
  reason: DecisionReason
  note: string | null
}

export const NOT_ALLOWED_NOTICE =
  'Only the CDP team can approve, reject or mark requests as done. If you need this one moved along, ask in this thread.'

export function buildRejectReviewModal(prompt: IRejectReviewPrompt): View {
  return {
    type: 'modal',
    callback_id: REJECT_REVIEW_CALLBACK_ID,
    private_metadata: JSON.stringify(prompt),
    title: { type: 'plain_text', text: 'Reject request' },
    submit: { type: 'plain_text', text: 'Reject' },
    close: { type: 'plain_text', text: 'Cancel' },
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `Reject *${escapeSlackText(prompt.repoName)}*?` },
      },
      {
        type: 'input',
        block_id: REASON_BLOCK_ID,
        label: { type: 'plain_text', text: 'Reason' },
        element: {
          type: 'radio_buttons',
          action_id: REASON_ACTION_ID,
          options: DECISION_REASONS.map((reason) => ({
            value: reason,
            text: { type: 'plain_text', text: DECISION_REASON_LABELS[reason] },
          })),
        },
      },
      {
        type: 'input',
        block_id: NOTE_BLOCK_ID,
        optional: true,
        label: { type: 'plain_text', text: 'Note for the requester (optional)' },
        element: {
          type: 'plain_text_input',
          action_id: NOTE_ACTION_ID,
          multiline: true,
          max_length: MAX_NOTE_LENGTH,
        },
      },
    ],
  }
}

export function buildNotAllowedModal(): View {
  return {
    type: 'modal',
    callback_id: NOT_ALLOWED_CALLBACK_ID,
    title: { type: 'plain_text', text: 'Not allowed' },
    close: { type: 'plain_text', text: 'Close' },
    blocks: [{ type: 'section', text: { type: 'mrkdwn', text: NOT_ALLOWED_NOTICE } }],
  }
}

export interface ISubmittedView {
  callback_id?: string
  private_metadata?: string
  state?: { values?: Record<string, Record<string, ISubmittedValue>> }
}

interface ISubmittedValue {
  selected_option?: { value?: string } | null
  value?: string | null
}

function parsePrompt(privateMetadata: string | undefined): IRejectReviewPrompt | null {
  if (!privateMetadata) {
    return null
  }
  try {
    const parsed = JSON.parse(privateMetadata) as Partial<IRejectReviewPrompt>
    if (
      typeof parsed.catalogId === 'string' &&
      typeof parsed.repoName === 'string' &&
      typeof parsed.responseUrl === 'string'
    ) {
      return {
        catalogId: parsed.catalogId,
        repoName: parsed.repoName,
        responseUrl: parsed.responseUrl,
      }
    }
  } catch {
    return null
  }
  return null
}

export function parseRejectReviewSubmission(view: ISubmittedView): IRejectReviewSubmission | null {
  if (view.callback_id !== REJECT_REVIEW_CALLBACK_ID) {
    return null
  }
  const prompt = parsePrompt(view.private_metadata)
  const reason = view.state?.values?.[REASON_BLOCK_ID]?.[REASON_ACTION_ID]?.selected_option?.value
  if (!prompt || !isDecisionReason(reason)) {
    return null
  }
  const note = view.state?.values?.[NOTE_BLOCK_ID]?.[NOTE_ACTION_ID]?.value?.trim()
  return { ...prompt, reason, note: note ? note.slice(0, MAX_NOTE_LENGTH) : null }
}
