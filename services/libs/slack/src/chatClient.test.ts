import { beforeEach, describe, expect, it, vi } from 'vitest'

const postMessage = vi.fn()
const update = vi.fn()
const getPermalink = vi.fn()
const addReaction = vi.fn()
const removeReaction = vi.fn()

vi.mock('@slack/web-api', () => ({
  WebClient: vi.fn().mockImplementation(function WebClient() {
    return {
      chat: { postMessage, update, getPermalink },
      reactions: { add: addReaction, remove: removeReaction },
    }
  }),
}))

const getSlackBotConfig = vi.fn()
vi.mock('./botConfig', () => ({ getSlackBotConfig }))

describe('chatClient', () => {
  beforeEach(() => {
    vi.resetModules()
    postMessage.mockReset()
    update.mockReset()
    getPermalink.mockReset()
    addReaction.mockReset()
    removeReaction.mockReset()
    getSlackBotConfig.mockReset()
  })

  describe('postSlackMessage', () => {
    it('returns an error when the bot token is not configured', async () => {
      getSlackBotConfig.mockReturnValue({ botToken: undefined })
      const { postSlackMessage } = await import('./chatClient.js')

      const result = await postSlackMessage({ channel: '#general', text: 'hi' })

      expect(result).toEqual({ ok: false, error: 'Slack bot client not available' })
      expect(postMessage).not.toHaveBeenCalled()
    })

    it('returns the message timestamp on success', async () => {
      getSlackBotConfig.mockReturnValue({ botToken: 'xoxb-test' })
      postMessage.mockResolvedValue({ ts: '123.456' })
      const { postSlackMessage } = await import('./chatClient.js')

      const result = await postSlackMessage({ channel: '#general', text: 'hi' })

      expect(result).toEqual({ ok: true, ts: '123.456' })
    })

    it('returns the error message when the SDK call is rejected', async () => {
      getSlackBotConfig.mockReturnValue({ botToken: 'xoxb-test' })
      postMessage.mockRejectedValue(new Error('channel_not_found'))
      const { postSlackMessage } = await import('./chatClient.js')

      const result = await postSlackMessage({ channel: '#general', text: 'hi' })

      expect(result).toEqual({ ok: false, error: 'channel_not_found' })
    })
  })

  describe('updateSlackMessage', () => {
    it('returns an error when the bot token is not configured', async () => {
      getSlackBotConfig.mockReturnValue({ botToken: undefined })
      const { updateSlackMessage } = await import('./chatClient.js')

      const result = await updateSlackMessage({ channel: '#general', ts: '123.456', text: 'hi' })

      expect(result).toEqual({ ok: false, error: 'Slack bot client not available' })
      expect(update).not.toHaveBeenCalled()
    })

    it('returns ok on success', async () => {
      getSlackBotConfig.mockReturnValue({ botToken: 'xoxb-test' })
      update.mockResolvedValue({})
      const { updateSlackMessage } = await import('./chatClient.js')

      const result = await updateSlackMessage({ channel: '#general', ts: '123.456', text: 'hi' })

      expect(result).toEqual({ ok: true })
    })

    it('returns the error message when the SDK call is rejected', async () => {
      getSlackBotConfig.mockReturnValue({ botToken: 'xoxb-test' })
      update.mockRejectedValue(new Error('message_not_found'))
      const { updateSlackMessage } = await import('./chatClient.js')

      const result = await updateSlackMessage({ channel: '#general', ts: '123.456', text: 'hi' })

      expect(result).toEqual({ ok: false, error: 'message_not_found' })
    })
  })

  describe('getSlackPermalink', () => {
    it('returns null when the bot token is not configured', async () => {
      getSlackBotConfig.mockReturnValue({ botToken: undefined })
      const { getSlackPermalink } = await import('./chatClient.js')

      expect(await getSlackPermalink('C1', '123.456')).toBeNull()
      expect(getPermalink).not.toHaveBeenCalled()
    })

    it('returns the permalink on success', async () => {
      getSlackBotConfig.mockReturnValue({ botToken: 'xoxb-test' })
      getPermalink.mockResolvedValue({ permalink: 'https://slack.test/archives/C1/p123456' })
      const { getSlackPermalink } = await import('./chatClient.js')

      expect(await getSlackPermalink('C1', '123.456')).toBe(
        'https://slack.test/archives/C1/p123456',
      )
      expect(getPermalink).toHaveBeenCalledWith({ channel: 'C1', message_ts: '123.456' })
    })

    it('returns null when the response has no permalink', async () => {
      getSlackBotConfig.mockReturnValue({ botToken: 'xoxb-test' })
      getPermalink.mockResolvedValue({})
      const { getSlackPermalink } = await import('./chatClient.js')

      expect(await getSlackPermalink('C1', '123.456')).toBeNull()
    })

    it('returns null when the SDK call is rejected', async () => {
      getSlackBotConfig.mockReturnValue({ botToken: 'xoxb-test' })
      getPermalink.mockRejectedValue(new Error('message_not_found'))
      const { getSlackPermalink } = await import('./chatClient.js')

      expect(await getSlackPermalink('C1', '123.456')).toBeNull()
    })
  })

  describe('reactions', () => {
    const target = { channel: 'C1', timestamp: '123.456', name: 'eyes' }

    it('adds and removes a reaction on the message', async () => {
      getSlackBotConfig.mockReturnValue({ botToken: 'xoxb-test' })
      addReaction.mockResolvedValue({})
      removeReaction.mockResolvedValue({})
      const { addSlackReaction, removeSlackReaction } = await import('./chatClient.js')

      expect(await addSlackReaction(target)).toEqual({ ok: true })
      expect(await removeSlackReaction(target)).toEqual({ ok: true })
      expect(addReaction).toHaveBeenCalledWith({ ...target, token: undefined })
      expect(removeReaction).toHaveBeenCalledWith({ ...target, token: undefined })
    })

    it('treats already_reacted and no_reaction as success', async () => {
      getSlackBotConfig.mockReturnValue({ botToken: 'xoxb-test' })
      addReaction.mockRejectedValue(
        Object.assign(new Error('An API error occurred: already_reacted'), {
          data: { error: 'already_reacted' },
        }),
      )
      removeReaction.mockRejectedValue(
        Object.assign(new Error('An API error occurred: no_reaction'), {
          data: { error: 'no_reaction' },
        }),
      )
      const { addSlackReaction, removeSlackReaction } = await import('./chatClient.js')

      expect(await addSlackReaction(target)).toEqual({ ok: true })
      expect(await removeSlackReaction(target)).toEqual({ ok: true })
    })

    it('reports other errors', async () => {
      getSlackBotConfig.mockReturnValue({ botToken: 'xoxb-test' })
      addReaction.mockRejectedValue(
        Object.assign(new Error('An API error occurred: missing_scope'), {
          data: { error: 'missing_scope' },
        }),
      )
      const { addSlackReaction } = await import('./chatClient.js')

      expect(await addSlackReaction(target)).toEqual({
        ok: false,
        error: 'An API error occurred: missing_scope',
      })
    })
  })
})
