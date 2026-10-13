import { beforeEach, describe, expect, it, vi } from 'vitest'

const { postSlackMessage, getSlackBotConfig } = vi.hoisted(() => ({
  postSlackMessage: vi.fn(),
  getSlackBotConfig: vi.fn(),
}))
vi.mock('./chatClient', () => ({ postSlackMessage }))
vi.mock('./botConfig', () => ({ getSlackBotConfig }))

import {
  APPROVE_REVIEW_ACTION_ID,
  IReviewRequestCard,
  REJECT_REVIEW_ACTION_ID,
  buildReviewDecisionMessage,
  buildReviewRequestBlocks,
  postReviewRequest,
} from './reviewRequest'

const card: IReviewRequestCard = {
  id: 'catalog-1',
  repoName: 'kops',
  repoUrl: 'https://github.com/kubernetes/kops',
  projectName: 'Kubernetes',
  classificationKind: 'lf_in_cdp',
  proposedAction: 'update_integration',
  sourceUrl: 'https://lfx.slack.com/archives/C123/p1700000000000100',
}

describe('buildReviewRequestBlocks', () => {
  it('renders the summary, the classification and both buttons carrying the catalog id', () => {
    const blocks = buildReviewRequestBlocks(card)

    expect(JSON.stringify(blocks)).toContain('*kops*')
    expect(JSON.stringify(blocks)).toContain(
      '<https://lfx.slack.com/archives/C123/p1700000000000100|Slack request>',
    )
    expect(JSON.stringify(blocks)).toContain('`lf_in_cdp`')
    expect(JSON.stringify(blocks)).toContain('`update_integration`')

    const actions = blocks.find((block) => block.type === 'actions')
    expect(actions).toMatchObject({
      elements: [
        { action_id: APPROVE_REVIEW_ACTION_ID, value: 'catalog-1' },
        { action_id: REJECT_REVIEW_ACTION_ID, value: 'catalog-1' },
      ],
    })
  })

  it('links a non-Slack origin as is and marks missing fields', () => {
    const blocks = buildReviewRequestBlocks({
      ...card,
      projectName: null,
      proposedAction: null,
      sourceUrl: 'https://github.com/org/repo/discussions/1',
    })

    const rendered = JSON.stringify(blocks)
    expect(rendered).toContain(
      '<https://github.com/org/repo/discussions/1|https://github.com/org/repo/discussions/1>',
    )
    expect(rendered).toContain('Project: _not provided_')
    expect(rendered).toContain('*Proposed action*\\n_unknown_')
  })
})

describe('buildReviewRequestBlocks escaping', () => {
  it('encodes mrkdwn control characters in untrusted fields', () => {
    const rendered = JSON.stringify(
      buildReviewRequestBlocks({
        ...card,
        repoName: 'a<b>c',
        projectName: '<!channel> R&D',
        sourceUrl: 'https://example.com/?a=1&b=<2>',
      }),
    )

    expect(rendered).toContain('*a&lt;b&gt;c*')
    expect(rendered).toContain('Project: &lt;!channel&gt; R&amp;D')
    expect(rendered).toContain(
      '<https://example.com/?a=1&b=<2>|https://example.com/?a=1&amp;b=&lt;2&gt;>',
    )
    expect(rendered).not.toContain('<!channel>')
  })
})

describe('buildReviewDecisionMessage', () => {
  it('drops the buttons and records who decided', () => {
    const message = buildReviewDecisionMessage(card, 'approve', 'U123', {
      onboardingStarted: true,
    })

    expect(message.text).toBe('Approved — kops')
    expect(message.blocks.some((block) => block.type === 'actions')).toBe(false)
    expect(JSON.stringify(message.blocks)).toContain('Approved by <@U123>, onboarding started.')
  })

  it('says the approved row is queued when onboarding did not start', () => {
    const message = buildReviewDecisionMessage(card, 'approve', 'U123', {
      onboardingStarted: false,
    })

    expect(JSON.stringify(message.blocks)).toContain(
      'Approved by <@U123>, queued for the next onboarding run.',
    )
  })

  it('renders a rejection', () => {
    const message = buildReviewDecisionMessage(card, 'reject', 'U123', {
      onboardingStarted: false,
    })

    expect(message.text).toBe('Rejected — kops')
    expect(JSON.stringify(message.blocks)).toContain('Rejected by <@U123>')
  })
})

describe('postReviewRequest', () => {
  beforeEach(() => {
    postSlackMessage.mockReset()
    getSlackBotConfig.mockReset()
  })

  it('fails without a review channel and never calls Slack', async () => {
    getSlackBotConfig.mockReturnValue({ reviewChannelId: undefined })

    const result = await postReviewRequest(card)

    expect(result).toEqual({ ok: false, error: 'Slack review channel not configured' })
    expect(postSlackMessage).not.toHaveBeenCalled()
  })

  it('posts the card to the review channel and returns the message ts', async () => {
    getSlackBotConfig.mockReturnValue({ reviewChannelId: 'C-REVIEW' })
    postSlackMessage.mockResolvedValue({ ok: true, ts: '1.2' })

    const result = await postReviewRequest(card)

    expect(result).toEqual({ ok: true, ts: '1.2' })
    expect(postSlackMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'C-REVIEW',
        text: 'Review needed — kops (update_integration)',
      }),
    )
  })
})
