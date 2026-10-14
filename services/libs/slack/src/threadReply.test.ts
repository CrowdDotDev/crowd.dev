import { beforeEach, describe, expect, it, vi } from 'vitest'

const { postSlackMessage, addSlackReaction, removeSlackReaction } = vi.hoisted(() => ({
  postSlackMessage: vi.fn(),
  addSlackReaction: vi.fn(),
  removeSlackReaction: vi.fn(),
}))
vi.mock('./chatClient', () => ({ postSlackMessage, addSlackReaction, removeSlackReaction }))

import {
  parseSlackPermalink,
  postSlackContentInThread,
  replyInSlackThread,
  setSlackRequestReactions,
} from './threadReply'

describe('parseSlackPermalink', () => {
  it('parses a top level message permalink', () => {
    expect(
      parseSlackPermalink('https://acme.slack.com/archives/C0123ABC/p1760000000123456'),
    ).toEqual({ channel: 'C0123ABC', ts: '1760000000.123456', threadTs: '1760000000.123456' })
  })

  it('uses the parent thread when the permalink points at a reply', () => {
    expect(
      parseSlackPermalink(
        'https://acme.slack.com/archives/C0123ABC/p1760000000123456?thread_ts=1759999999.000100&cid=C0123ABC',
      ),
    ).toEqual({ channel: 'C0123ABC', ts: '1760000000.123456', threadTs: '1759999999.000100' })
  })

  it('returns null for anything that is not a Slack message permalink', () => {
    expect(parseSlackPermalink('https://github.com/acme/widget/discussions/1')).toBeNull()
    expect(parseSlackPermalink('https://acme.slack.com/archives/C0123ABC')).toBeNull()
    expect(parseSlackPermalink('https://acme.slack.com/archives/C0123ABC/p123')).toBeNull()
  })
})

describe('replyInSlackThread', () => {
  beforeEach(() => {
    postSlackMessage.mockReset()
  })

  it('posts the text in the thread of the linked message', async () => {
    postSlackMessage.mockResolvedValue({ ok: true, ts: '1760000001.000000' })

    const result = await replyInSlackThread(
      'https://acme.slack.com/archives/C0123ABC/p1760000000123456?thread_ts=1759999999.000100&cid=C0123ABC',
      'done',
    )

    expect(result).toEqual({ ok: true })
    expect(postSlackMessage).toHaveBeenCalledWith({
      channel: 'C0123ABC',
      thread_ts: '1759999999.000100',
      text: 'done',
    })
  })

  it('fails without posting when the source is not a Slack permalink', async () => {
    const result = await replyInSlackThread('https://github.com/acme/widget/discussions/1', 'x')

    expect(result).toEqual({ ok: false, error: 'not a Slack message permalink' })
    expect(postSlackMessage).not.toHaveBeenCalled()
  })

  it('fails without posting when no source was recorded', async () => {
    const result = await replyInSlackThread(null, 'x')

    expect(result.ok).toBe(false)
    expect(postSlackMessage).not.toHaveBeenCalled()
  })

  it('surfaces the chat client error', async () => {
    postSlackMessage.mockResolvedValue({ ok: false, error: 'channel_not_found' })

    const result = await replyInSlackThread(
      'https://acme.slack.com/archives/C0123ABC/p1760000000123456',
      'x',
    )

    expect(result).toEqual({ ok: false, error: 'channel_not_found' })
  })
})

describe('postSlackContentInThread', () => {
  beforeEach(() => {
    postSlackMessage.mockReset()
  })

  it('posts blocks in the thread and returns where the message landed', async () => {
    postSlackMessage.mockResolvedValue({ ok: true, ts: '1760000001.000000' })

    const result = await postSlackContentInThread(
      'https://acme.slack.com/archives/C0123ABC/p1760000000123456',
      { text: 'card', blocks: [{ type: 'divider' }] },
    )

    expect(result).toEqual({ ok: true, channel: 'C0123ABC', ts: '1760000001.000000' })
    expect(postSlackMessage).toHaveBeenCalledWith({
      channel: 'C0123ABC',
      thread_ts: '1760000000.123456',
      text: 'card',
      blocks: [{ type: 'divider' }],
    })
  })
})

describe('setSlackRequestReactions', () => {
  beforeEach(() => {
    addSlackReaction.mockReset().mockResolvedValue({ ok: true })
    removeSlackReaction.mockReset().mockResolvedValue({ ok: true })
  })

  it('targets the linked message itself, not the thread parent', async () => {
    const result = await setSlackRequestReactions(
      'https://acme.slack.com/archives/C0123ABC/p1760000000123456?thread_ts=1759999999.000100',
      { add: ['eyes'], remove: ['hourglass_flowing_sand'] },
    )

    expect(result).toEqual({ ok: true })
    expect(removeSlackReaction).toHaveBeenCalledWith({
      channel: 'C0123ABC',
      timestamp: '1760000000.123456',
      name: 'hourglass_flowing_sand',
    })
    expect(addSlackReaction).toHaveBeenCalledWith({
      channel: 'C0123ABC',
      timestamp: '1760000000.123456',
      name: 'eyes',
    })
  })

  it('surfaces the first failure and refuses non-permalinks', async () => {
    addSlackReaction.mockResolvedValue({ ok: false, error: 'missing_scope' })

    expect(
      await setSlackRequestReactions('https://acme.slack.com/archives/C0123ABC/p1760000000123456', {
        add: ['eyes'],
        remove: [],
      }),
    ).toEqual({ ok: false, error: 'missing_scope' })
    expect(await setSlackRequestReactions(null, { add: ['eyes'], remove: [] })).toEqual({
      ok: false,
      error: 'not a Slack message permalink',
    })
  })
})
