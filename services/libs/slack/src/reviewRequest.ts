import type { KnownBlock } from '@slack/web-api'

import { getSlackBotConfig } from './botConfig'
import { postSlackMessage } from './chatClient'
import { escapeSlackText } from './mrkdwn'

export const APPROVE_REVIEW_ACTION_ID = 'approve_review'
export const REJECT_REVIEW_ACTION_ID = 'reject_review'

export type ReviewDecision = 'approve' | 'reject'

export interface IReviewRequestCard {
  id: string
  repoName: string
  repoUrl: string
  projectName: string | null
  sourceUrl: string | null
  reviewReason: string | null
  whatsNeeded: string
  details: string | null
}

export interface IReviewDecisionMessage {
  text: string
  blocks: KnownBlock[]
}

const SLACK_PERMALINK_PATTERN = /^https:\/\/[^/]+\.slack\.com\/archives\//

function formatRequestedIn(sourceUrl: string | null): string {
  if (!sourceUrl) {
    return '_source not recorded_'
  }

  return SLACK_PERMALINK_PATTERN.test(sourceUrl)
    ? `<${sourceUrl}|Slack request>`
    : `<${sourceUrl}|${escapeSlackText(sourceUrl)}>`
}

function formatRepoUrl(repoUrl: string): string {
  return `\`${escapeSlackText(repoUrl)}\``
}

function detailsBlock(details: string | null): KnownBlock[] {
  return details
    ? [{ type: 'context', elements: [{ type: 'mrkdwn', text: escapeSlackText(details) }] }]
    : []
}

function summaryBlocks(card: IReviewRequestCard): KnownBlock[] {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `*${escapeSlackText(card.repoName)}*`,
          escapeSlackText(card.repoUrl),
          `Project: ${card.projectName ? escapeSlackText(card.projectName) : '_not provided_'}`,
          `Requested in: ${formatRequestedIn(card.sourceUrl)}`,
        ].join('\n'),
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Why a review*\n${card.reviewReason ? escapeSlackText(card.reviewReason) : '_not recorded_'}`,
        },
        { type: 'mrkdwn', text: `*What's needed*\n${escapeSlackText(card.whatsNeeded)}` },
      ],
    },
    ...detailsBlock(card.details),
  ]
}

export function buildReviewRequestBlocks(card: IReviewRequestCard): KnownBlock[] {
  return [
    ...summaryBlocks(card),
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          action_id: APPROVE_REVIEW_ACTION_ID,
          value: card.id,
          style: 'primary',
          text: { type: 'plain_text', text: 'Approve' },
          confirm: {
            title: { type: 'plain_text', text: 'Approve onboarding?' },
            text: {
              type: 'mrkdwn',
              text: `${formatRepoUrl(card.repoUrl)} will be added to its LFX Insights project.`,
            },
            confirm: { type: 'plain_text', text: 'Approve' },
            deny: { type: 'plain_text', text: 'Cancel' },
          },
        },
        {
          type: 'button',
          action_id: REJECT_REVIEW_ACTION_ID,
          value: card.id,
          style: 'danger',
          text: { type: 'plain_text', text: 'Reject' },
          confirm: {
            title: { type: 'plain_text', text: 'Reject onboarding?' },
            text: { type: 'mrkdwn', text: `${formatRepoUrl(card.repoUrl)} won't be added.` },
            confirm: { type: 'plain_text', text: 'Reject' },
            deny: { type: 'plain_text', text: 'Cancel' },
          },
        },
      ],
    },
  ]
}

export function buildReviewRequestText(card: IReviewRequestCard): string {
  return `Review needed — ${escapeSlackText(card.repoName)}`
}

function decisionOutcome(
  decision: ReviewDecision,
  reviewedBy: string,
  onboardingStarted: boolean,
): string {
  if (decision === 'reject') {
    return `:no_entry_sign: Rejected by <@${reviewedBy}>, the repository was skipped.`
  }
  return onboardingStarted
    ? `:white_check_mark: Approved by <@${reviewedBy}>, onboarding started.`
    : `:white_check_mark: Approved by <@${reviewedBy}>, queued for the next onboarding run.`
}

export function buildReviewDecisionMessage(
  card: IReviewRequestCard,
  decision: ReviewDecision,
  reviewedBy: string,
  options: { onboardingStarted: boolean },
): IReviewDecisionMessage {
  const outcome = decisionOutcome(decision, reviewedBy, options.onboardingStarted)

  return {
    text: `${decision === 'approve' ? 'Approved' : 'Rejected'} — ${escapeSlackText(card.repoName)}`,
    blocks: [
      ...summaryBlocks(card),
      { type: 'context', elements: [{ type: 'mrkdwn', text: outcome }] },
    ],
  }
}

export async function postReviewRequest(
  card: IReviewRequestCard,
): Promise<{ ok: boolean; ts?: string; error?: string }> {
  const { reviewChannelId } = getSlackBotConfig()
  if (!reviewChannelId) {
    return { ok: false, error: 'Slack review channel not configured' }
  }

  return postSlackMessage({
    channel: reviewChannelId,
    text: buildReviewRequestText(card),
    blocks: buildReviewRequestBlocks(card),
  })
}
