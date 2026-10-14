import type { Button, KnownBlock } from '@slack/web-api'

import { githubRepoPath } from '@crowd/common'
import { getServiceLogger } from '@crowd/logging'

import { getSlackBotConfig } from './botConfig'
import { getSlackPermalink, postSlackMessage } from './chatClient'
import { escapeSlackText } from './mrkdwn'
import { parseSlackPermalink, postSlackContentInThread } from './threadReply'

const log = getServiceLogger()

export const APPROVE_REVIEW_ACTION_ID = 'approve_review'
export const REJECT_REVIEW_ACTION_ID = 'reject_review'
export const MARK_DONE_REVIEW_ACTION_ID = 'mark_done_review'
export const OPEN_IN_CDP_ACTION_ID = 'open_in_cdp'

export type ReviewDecision = 'approve' | 'reject' | 'done'

export type ReviewCardAction = 'add_to_connection' | 'connect_github' | 'manual'

export interface IReviewRequestCard {
  id: string
  repoName: string
  repoUrl: string
  sourceUrl: string | null
  requestedName: string | null
  matchedName: string | null
  insightsState: string
  whatsNeeded: string
  mismatch: boolean
  action: ReviewCardAction
  cdpUrl: string | null
  details: string | null
}

export interface IReviewDecisionMessage {
  text: string
  blocks: KnownBlock[]
}

const SLACK_PERMALINK_PATTERN = /^https:\/\/[^/]+\.slack\.com\/archives\//
const MAX_BUTTON_TEXT_LENGTH = 75
const MISMATCH_NOTICE =
  ':warning: Requested name and matched project differ. Check before going ahead.'
const FALLBACK_PROJECT_LABEL = 'the project'

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

function contextBlock(text: string): KnownBlock {
  return { type: 'context', elements: [{ type: 'mrkdwn', text }] }
}

function detailsBlock(details: string | null): KnownBlock[] {
  return details ? [contextBlock(escapeSlackText(details))] : []
}

function isPostedInRequestThread(card: IReviewRequestCard): boolean {
  return !!card.sourceUrl && SLACK_PERMALINK_PATTERN.test(card.sourceUrl)
}

function field(label: string, value: string): { type: 'mrkdwn'; text: string } {
  return { type: 'mrkdwn', text: `*${label}*\n${value}` }
}

function summaryBlocks(card: IReviewRequestCard): KnownBlock[] {
  const lines = [`*${escapeSlackText(card.repoName)}*`, escapeSlackText(card.repoUrl)]
  if (!isPostedInRequestThread(card)) {
    lines.push(`Requested in: ${formatRequestedIn(card.sourceUrl)}`)
  }
  return [
    { type: 'section', text: { type: 'mrkdwn', text: lines.join('\n') } },
    {
      type: 'section',
      fields: [
        field(
          'Requested as',
          card.requestedName ? escapeSlackText(card.requestedName) : '_not provided_',
        ),
        field('Matched to', card.matchedName ? escapeSlackText(card.matchedName) : '_no match_'),
        field('In LFX Insights', escapeSlackText(card.insightsState)),
        field("What's needed", escapeSlackText(card.whatsNeeded)),
      ],
    },
    ...(card.mismatch ? [contextBlock(MISMATCH_NOTICE)] : []),
    ...detailsBlock(card.details),
  ]
}

function buttonText(text: string): string {
  return text.length > MAX_BUTTON_TEXT_LENGTH
    ? `${text.slice(0, MAX_BUTTON_TEXT_LENGTH - 1)}…`
    : text
}

function matchedLabel(card: IReviewRequestCard): string {
  return card.matchedName ?? FALLBACK_PROJECT_LABEL
}

function confirmDialog(title: string, text: string, confirm: string): Button['confirm'] {
  return {
    title: { type: 'plain_text', text: title },
    text: { type: 'mrkdwn', text },
    confirm: { type: 'plain_text', text: confirm },
    deny: { type: 'plain_text', text: 'Cancel' },
  }
}

function approveButton(card: IReviewRequestCard, text: string, confirmText: string): Button {
  return {
    type: 'button',
    action_id: APPROVE_REVIEW_ACTION_ID,
    value: card.id,
    style: 'primary',
    text: { type: 'plain_text', text: buttonText(text) },
    confirm: confirmDialog('Approve onboarding?', confirmText, 'Approve'),
  }
}

function manualButtons(card: IReviewRequestCard): Button[] {
  const openInCdp: Button[] = card.cdpUrl
    ? [
        {
          type: 'button',
          action_id: OPEN_IN_CDP_ACTION_ID,
          url: card.cdpUrl,
          text: { type: 'plain_text', text: 'Open in CDP ↗' },
        },
      ]
    : []
  return [
    ...openInCdp,
    {
      type: 'button',
      action_id: MARK_DONE_REVIEW_ACTION_ID,
      value: card.id,
      style: 'primary',
      text: { type: 'plain_text', text: 'Mark as done' },
      confirm: confirmDialog(
        'Mark as done?',
        'Only after the repo was added by hand in CDP. The requester will be told it is done.',
        'Mark as done',
      ),
    },
  ]
}

function decisionButtons(card: IReviewRequestCard): Button[] {
  const matched = escapeSlackText(matchedLabel(card))
  switch (card.action) {
    case 'add_to_connection':
      return [
        approveButton(
          card,
          `Add to ${matchedLabel(card)}`,
          `${formatRepoUrl(card.repoUrl)} will be added to ${matched}'s GitHub connection.`,
        ),
      ]
    case 'connect_github':
      return [
        approveButton(
          card,
          'Connect GitHub and add repo',
          `GitHub will be connected to ${matched} with ${formatRepoUrl(card.repoUrl)}.`,
        ),
      ]
    case 'manual':
      return manualButtons(card)
  }
}

function rejectButton(card: IReviewRequestCard): Button {
  return {
    type: 'button',
    action_id: REJECT_REVIEW_ACTION_ID,
    value: card.id,
    style: 'danger',
    text: { type: 'plain_text', text: 'Reject' },
    confirm: confirmDialog(
      'Reject onboarding?',
      `${formatRepoUrl(card.repoUrl)} won't be added.`,
      'Reject',
    ),
  }
}

export function buildReviewRequestBlocks(card: IReviewRequestCard): KnownBlock[] {
  return [
    ...summaryBlocks(card),
    { type: 'actions', elements: [...decisionButtons(card), rejectButton(card)] },
  ]
}

export function buildReviewRequestText(card: IReviewRequestCard): string {
  return `Review needed — ${escapeSlackText(githubRepoPath(card.repoUrl) ?? card.repoName)}`
}

function decisionOutcome(
  decision: ReviewDecision,
  reviewedBy: string,
  onboardingStarted: boolean,
): string {
  switch (decision) {
    case 'reject':
      return `:no_entry_sign: Rejected by <@${reviewedBy}>, the repository was skipped.`
    case 'done':
      return `:white_check_mark: Marked as done by <@${reviewedBy}>, added by hand in CDP.`
    case 'approve':
      return onboardingStarted
        ? `:white_check_mark: Approved by <@${reviewedBy}>, onboarding started.`
        : `:white_check_mark: Approved by <@${reviewedBy}>, queued for the next onboarding run.`
  }
}

const DECISION_TITLES: Record<ReviewDecision, string> = {
  approve: 'Approved',
  reject: 'Rejected',
  done: 'Done',
}

export function buildReviewDecisionMessage(
  card: IReviewRequestCard,
  decision: ReviewDecision,
  reviewedBy: string,
  options: { onboardingStarted: boolean },
): IReviewDecisionMessage {
  const outcome = decisionOutcome(decision, reviewedBy, options.onboardingStarted)

  return {
    text: `${DECISION_TITLES[decision]} — ${escapeSlackText(card.repoName)}`,
    blocks: [...summaryBlocks(card), contextBlock(outcome)],
  }
}

export interface IReviewRequestPostResult {
  ok: boolean
  ts?: string
  error?: string
}

async function postReviewNotice(
  reviewChannelId: string,
  card: IReviewRequestCard,
  cardChannel: string,
  cardTs: string,
): Promise<void> {
  const permalink = await getSlackPermalink(cardChannel, cardTs)
  if (!permalink) {
    log.warn({ cardId: card.id }, 'Review notice skipped: no permalink for the thread card.')
    return
  }
  const result = await postSlackMessage({
    channel: reviewChannelId,
    text: `${buildReviewRequestText(card)} · <${permalink}|Open the request>`,
  })
  if (!result.ok) {
    log.warn(
      { cardId: card.id, error: result.error },
      'Review notice was not posted to the channel.',
    )
  }
}

export async function postReviewRequest(
  card: IReviewRequestCard,
  origin: string | null,
): Promise<IReviewRequestPostResult> {
  const { reviewChannelId } = getSlackBotConfig()
  const content = { text: buildReviewRequestText(card), blocks: buildReviewRequestBlocks(card) }

  if (origin && parseSlackPermalink(origin)) {
    const posted = await postSlackContentInThread(origin, content)
    if (posted.ok && posted.ts && posted.channel && reviewChannelId) {
      await postReviewNotice(reviewChannelId, card, posted.channel, posted.ts)
    }
    return posted
  }

  if (!reviewChannelId) {
    return { ok: false, error: 'Slack review channel not configured' }
  }

  return postSlackMessage({ channel: reviewChannelId, ...content })
}
