import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./verifySignature', () => ({ verifySlackSignature: vi.fn(() => true) }))
vi.mock('@/services/slack/onboardingRequestBot', () => ({
  runOnboardingRequestBot: vi.fn(async () => undefined),
}))

import { runOnboardingRequestBot } from '@/services/slack/onboardingRequestBot'

import { createEventsHandler } from './events'
import { verifySlackSignature } from './verifySignature'

const claimEvent = vi.fn(async () => true)
const temporal = { workflow: { start: vi.fn() } } as never
const events = createEventsHandler(claimEvent, temporal)

function call(body: object, headers: Record<string, string> = {}) {
  const req = {
    body,
    headers,
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  } as any
  const res = { sendStatus: vi.fn(), json: vi.fn() } as any
  return events(req, res).then(() => ({ req, res }))
}

const mention = {
  type: 'event_callback',
  event_id: 'Ev1',
  event: { type: 'app_mention', text: '<@U0BOT> hi', channel: 'C1', ts: '100.1' },
}

describe('slack events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(verifySlackSignature).mockReturnValue(true)
    claimEvent.mockResolvedValue(true)
  })

  it('answers the url verification challenge', async () => {
    const { res } = await call({ type: 'url_verification', challenge: 'abc' })

    expect(res.json).toHaveBeenCalledWith({ challenge: 'abc' })
  })

  it('acks a mention and queues it, replying in the message thread', async () => {
    const { req, res } = await call(mention)

    expect(res.sendStatus).toHaveBeenCalledWith(200)
    expect(runOnboardingRequestBot).toHaveBeenCalledWith(
      expect.objectContaining({
        text: '<@U0BOT> hi',
        channelId: 'C1',
        messageTs: '100.1',
        threadTs: '100.1',
        options: { log: req.log, temporal },
      }),
    )
  })

  it('replies in the existing thread when the mention is inside one', async () => {
    await call({ ...mention, event: { ...mention.event, thread_ts: '90.0' } })

    expect(runOnboardingRequestBot).toHaveBeenCalledWith(
      expect.objectContaining({ threadTs: '90.0', messageTs: '100.1' }),
    )
  })

  it('processes a Slack retry when the event was not handled yet', async () => {
    await call(mention, { 'x-slack-retry-num': '1' })

    expect(runOnboardingRequestBot).toHaveBeenCalledTimes(1)
  })

  it('ignores an event that was already handled', async () => {
    claimEvent.mockResolvedValue(false)

    await call(mention, { 'x-slack-retry-num': '1' })

    expect(claimEvent).toHaveBeenCalledWith('Ev1')
    expect(runOnboardingRequestBot).not.toHaveBeenCalled()
  })

  it('handles the event when deduplication is unavailable', async () => {
    claimEvent.mockRejectedValue(new Error('redis down'))

    const { req } = await call(mention)

    expect(req.log.warn).toHaveBeenCalled()
    expect(runOnboardingRequestBot).toHaveBeenCalledTimes(1)
  })

  it('ignores bot messages and other event types', async () => {
    await call({ ...mention, event: { ...mention.event, bot_id: 'B1' } })
    await call({ ...mention, event: { ...mention.event, type: 'message' } })

    expect(runOnboardingRequestBot).not.toHaveBeenCalled()
  })

  it('does nothing for unverified requests', async () => {
    vi.mocked(verifySlackSignature).mockReturnValue(false)

    const { res } = await call(mention)

    expect(res.sendStatus).toHaveBeenCalledWith(200)
    expect(runOnboardingRequestBot).not.toHaveBeenCalled()
  })
})
