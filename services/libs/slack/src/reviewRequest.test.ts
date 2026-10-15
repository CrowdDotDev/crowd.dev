import { beforeEach, describe, expect, it, vi } from 'vitest'

const { postSlackMessage, getSlackBotConfig } = vi.hoisted(() => ({
  postSlackMessage: vi.fn(),
  getSlackBotConfig: vi.fn(),
}))
vi.mock('./chatClient', () => ({
  postSlackMessage,
  getSlackPermalink: vi.fn(async () => 'https://lfx.slack.com/archives/C1/p1700000002000000'),
}))
vi.mock('./botConfig', () => ({ getSlackBotConfig }))

import {
  APPROVE_REVIEW_ACTION_ID,
  IReviewRequestCard,
  MARK_DONE_REVIEW_ACTION_ID,
  OPEN_IN_CDP_ACTION_ID,
  REJECT_REVIEW_ACTION_ID,
  buildReviewDecisionMessage,
  buildReviewRequestBlocks,
  formatRepoContext,
  postReviewRequest,
} from './reviewRequest'

const repoContext = {
  description: 'Kubernetes Operations <kOps> & friends',
  stars: 16384,
  pushedAt: '2026-09-01T10:00:00Z',
  isArchived: false,
  isFork: false,
  parentFullName: null,
}

describe('formatRepoContext', () => {
  it('joins the description, stars and last push', () => {
    expect(formatRepoContext(repoContext)).toBe(
      'Kubernetes Operations &lt;kOps&gt; &amp; friends · ★ 16,384 · last push 2026-09-01',
    )
  })

  it('flags forks and archived repositories in bold', () => {
    expect(
      formatRepoContext({
        ...repoContext,
        description: null,
        pushedAt: null,
        isFork: true,
        parentFullName: 'kubernetes/kops',
        isArchived: true,
      }),
    ).toBe('★ 16,384 · *fork of kubernetes/kops* · *archived*')
    expect(formatRepoContext({ ...repoContext, isFork: true })).toContain('· *fork*')
  })

  it('shortens a long description', () => {
    const formatted = formatRepoContext({ ...repoContext, description: 'x'.repeat(200) })

    expect(formatted.startsWith(`${'x'.repeat(120)}…`)).toBe(true)
  })
})

const card: IReviewRequestCard = {
  id: 'catalog-1',
  repoName: 'kops',
  repoUrl: 'https://github.com/kubernetes/kops',
  sourceUrl: 'https://lfx.slack.com/archives/C123/p1700000000000100',
  repoContext: null,
  requestedName: 'Kubernetes',
  matchedName: 'Kubernetes & co',
  insightsState: 'Project exists with GitHub connected',
  whatsNeeded: "Add this repo to Kubernetes & co's GitHub connection",
  mismatch: false,
  action: 'add_to_connection',
  cdpUrl: null,
  details: 'Details: lf_in_cdp · update_integration',
}

function actionElements(blocks: ReturnType<typeof buildReviewRequestBlocks>) {
  const actions = blocks.find((block) => block.type === 'actions')
  return actions && 'elements' in actions ? actions.elements : []
}

describe('buildReviewRequestBlocks', () => {
  it('renders the summary, the plain-language fields and the add button carrying the catalog id', () => {
    const blocks = buildReviewRequestBlocks(card)
    const rendered = JSON.stringify(blocks)

    expect(rendered).toContain('*kops*')
    expect(rendered).not.toContain('Requested in')
    expect(rendered).toContain('*Requested as*\\nKubernetes')
    expect(rendered).toContain('*Matched to*\\nKubernetes &amp; co')
    expect(rendered).toContain('*In LFX Insights*\\nProject exists with GitHub connected')
    expect(rendered).toContain(
      "*What's needed*\\nAdd this repo to Kubernetes &amp; co's GitHub connection",
    )
    expect(rendered).toContain('Details: lf_in_cdp · update_integration')
    expect(rendered).not.toContain('Requested name and matched project differ')
    expect(rendered).not.toContain('`lf_in_cdp`')

    expect(actionElements(blocks)).toMatchObject([
      {
        action_id: APPROVE_REVIEW_ACTION_ID,
        value: 'catalog-1',
        text: { text: 'Add to Kubernetes & co' },
        confirm: {
          text: {
            text: "`https://github.com/kubernetes/kops` will be added to Kubernetes &amp; co's GitHub connection.",
          },
        },
      },
      { action_id: REJECT_REVIEW_ACTION_ID, value: 'catalog-1' },
    ])
  })

  it('shows the GitHub context under the header when it is known', () => {
    const blocks = buildReviewRequestBlocks({ ...card, repoContext })

    expect(blocks[1]).toEqual({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: formatRepoContext(repoContext) }],
    })
  })

  it('offers to connect GitHub when the project has no connection yet', () => {
    const blocks = buildReviewRequestBlocks({ ...card, action: 'connect_github' })

    expect(actionElements(blocks)).toMatchObject([
      { action_id: APPROVE_REVIEW_ACTION_ID, text: { text: 'Connect GitHub and add repo' } },
      { action_id: REJECT_REVIEW_ACTION_ID },
    ])
  })

  it('shows the CDP link and Mark as done for rows that need a person', () => {
    const blocks = buildReviewRequestBlocks({
      ...card,
      action: 'manual',
      cdpUrl: 'https://cdp.test/integrations/gp-1/seg-1',
    })

    expect(actionElements(blocks)).toMatchObject([
      {
        action_id: OPEN_IN_CDP_ACTION_ID,
        url: 'https://cdp.test/integrations/gp-1/seg-1',
        text: { text: 'Open in CDP ↗' },
      },
      { action_id: MARK_DONE_REVIEW_ACTION_ID, value: 'catalog-1', text: { text: 'Mark as done' } },
      { action_id: REJECT_REVIEW_ACTION_ID, value: 'catalog-1' },
    ])
    expect(JSON.stringify(blocks)).not.toContain(APPROVE_REVIEW_ACTION_ID)
  })

  it('drops the CDP link when no url is known', () => {
    const blocks = buildReviewRequestBlocks({ ...card, action: 'manual' })

    expect(
      actionElements(blocks).map((element) => 'action_id' in element && element.action_id),
    ).toEqual([MARK_DONE_REVIEW_ACTION_ID, REJECT_REVIEW_ACTION_ID])
  })

  it('warns when the requested name and the matched project differ', () => {
    const rendered = JSON.stringify(
      buildReviewRequestBlocks({ ...card, requestedName: 'Common Cloud Controls', mismatch: true }),
    )

    expect(rendered).toContain(
      ':warning: Requested name and matched project differ. Check before going ahead.',
    )
  })

  it('keeps button labels within the Slack limit', () => {
    const matchedName = 'A'.repeat(100)
    const blocks = buildReviewRequestBlocks({ ...card, matchedName })

    const [add] = actionElements(blocks)
    expect('text' in add && add.text.text.length).toBe(75)
  })

  it('links a non-Slack origin as is and marks missing fields', () => {
    const blocks = buildReviewRequestBlocks({
      ...card,
      requestedName: null,
      matchedName: null,
      details: null,
      sourceUrl: 'https://github.com/org/repo/discussions/1',
    })

    const rendered = JSON.stringify(blocks)
    expect(rendered).toContain(
      'Requested in: <https://github.com/org/repo/discussions/1|https://github.com/org/repo/discussions/1>',
    )
    expect(rendered).toContain('*Requested as*\\n_not provided_')
    expect(rendered).toContain('*Matched to*\\n_no match_')
    expect(rendered).toContain('text":"Add to the project"')
    expect(blocks.some((block) => block.type === 'context')).toBe(false)
  })
})

describe('buildReviewRequestBlocks escaping', () => {
  it('encodes mrkdwn control characters in untrusted fields', () => {
    const rendered = JSON.stringify(
      buildReviewRequestBlocks({
        ...card,
        repoName: 'a<b>c',
        requestedName: '<!channel> R&D',
        sourceUrl: 'https://example.com/?a=1&b=<2>',
      }),
    )

    expect(rendered).toContain('*a&lt;b&gt;c*')
    expect(rendered).toContain('*Requested as*\\n&lt;!channel&gt; R&amp;D')
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

  it('renders a request marked as done by hand', () => {
    const message = buildReviewDecisionMessage(card, 'done', 'U123', {
      onboardingStarted: false,
    })

    expect(message.text).toBe('Done — kops')
    expect(JSON.stringify(message.blocks)).toContain(
      ':white_check_mark: Marked as done by <@U123>, added by hand in CDP.',
    )
  })
})

describe('postReviewRequest', () => {
  beforeEach(() => {
    postSlackMessage.mockReset()
    getSlackBotConfig.mockReset()
  })

  it('fails without a review channel and never calls Slack', async () => {
    getSlackBotConfig.mockReturnValue({ reviewChannelId: undefined })

    const result = await postReviewRequest(card, null)

    expect(result).toEqual({ ok: false, error: 'Slack review channel not configured' })
    expect(postSlackMessage).not.toHaveBeenCalled()
  })

  it('posts the card to the review channel and returns the message ts', async () => {
    getSlackBotConfig.mockReturnValue({ reviewChannelId: 'C-REVIEW' })
    postSlackMessage.mockResolvedValue({ ok: true, ts: '1.2' })

    const result = await postReviewRequest(card, 'https://github.com/org/repo/discussions/1')

    expect(result).toEqual({ ok: true, ts: '1.2' })
    expect(postSlackMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'C-REVIEW',
        text: 'Review needed — kubernetes/kops',
      }),
    )
  })

  it('posts the card in the request thread and a notice with a link in the review channel', async () => {
    getSlackBotConfig.mockReturnValue({ reviewChannelId: 'C-REVIEW' })
    postSlackMessage.mockResolvedValue({ ok: true, ts: '9.9' })

    const result = await postReviewRequest(
      card,
      'https://lfx.slack.com/archives/C123/p1700000000000100',
    )

    expect(result).toEqual({ ok: true, channel: 'C123', ts: '9.9' })
    expect(postSlackMessage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        channel: 'C123',
        thread_ts: '1700000000.000100',
        text: 'Review needed — kubernetes/kops',
        blocks: expect.any(Array),
      }),
    )
    expect(postSlackMessage).toHaveBeenNthCalledWith(2, {
      channel: 'C-REVIEW',
      text: 'Review needed — kubernetes/kops · <https://lfx.slack.com/archives/C1/p1700000002000000|Open the request>',
    })
  })

  it('posts the card in the thread even without a review channel', async () => {
    getSlackBotConfig.mockReturnValue({ reviewChannelId: undefined })
    postSlackMessage.mockResolvedValue({ ok: true, ts: '9.9' })

    const result = await postReviewRequest(
      card,
      'https://lfx.slack.com/archives/C123/p1700000000000100',
    )

    expect(result.ok).toBe(true)
    expect(postSlackMessage).toHaveBeenCalledTimes(1)
  })
})
