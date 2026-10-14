import { WebClient } from '@slack/web-api'
import type { ChatPostMessageArguments, ChatUpdateArguments } from '@slack/web-api'

import { getServiceLogger } from '@crowd/logging'

import { getSlackBotConfig } from './botConfig'

const log = getServiceLogger()

let botClient: WebClient | null | undefined

function getBotClient(): WebClient | null {
  if (botClient !== undefined) {
    return botClient
  }

  const { botToken } = getSlackBotConfig()
  if (!botToken) {
    log.warn('Slack bot token not configured, cannot create bot client.')
    botClient = null
    return botClient
  }

  botClient = new WebClient(botToken)
  return botClient
}

export async function postSlackMessage(
  args: ChatPostMessageArguments,
): Promise<{ ok: boolean; ts?: string; error?: string }> {
  const client = getBotClient()
  if (!client) {
    return { ok: false, error: 'Slack bot client not available' }
  }

  try {
    const response = await client.chat.postMessage({ ...args, token: undefined })
    return { ok: true, ts: response.ts }
  } catch (error) {
    log.error({ error, channel: args.channel }, 'Failed to post Slack bot message')
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function getSlackPermalink(
  channel: string,
  messageTs: string,
): Promise<string | null> {
  const client = getBotClient()
  if (!client) {
    return null
  }

  try {
    const response = await client.chat.getPermalink({ channel, message_ts: messageTs })
    return response.permalink ?? null
  } catch (error) {
    log.error({ error, channel, messageTs }, 'Failed to get Slack message permalink')
    return null
  }
}

export interface ISlackReactionTarget {
  channel: string
  timestamp: string
  name: string
}

const IDEMPOTENT_REACTION_ERRORS = new Set(['already_reacted', 'no_reaction'])

function slackErrorCode(error: unknown): string | undefined {
  const data = (error as { data?: { error?: string } } | null)?.data
  return data?.error
}

async function applyReaction(
  action: 'add' | 'remove',
  target: ISlackReactionTarget,
): Promise<{ ok: boolean; error?: string }> {
  const client = getBotClient()
  if (!client) {
    return { ok: false, error: 'Slack bot client not available' }
  }

  try {
    await client.reactions[action]({ ...target, token: undefined })
    return { ok: true }
  } catch (error) {
    const code = slackErrorCode(error)
    if (code && IDEMPOTENT_REACTION_ERRORS.has(code)) {
      return { ok: true }
    }
    log.error({ error, ...target, action }, 'Failed to change a Slack reaction')
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function deleteSlackMessage(
  channel: string,
  ts: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = getBotClient()
  if (!client) {
    return { ok: false, error: 'Slack bot client not available' }
  }

  try {
    await client.chat.delete({ channel, ts, token: undefined })
    return { ok: true }
  } catch (error) {
    log.error({ error, channel, ts }, 'Failed to delete Slack bot message')
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export function addSlackReaction(target: ISlackReactionTarget) {
  return applyReaction('add', target)
}

export function removeSlackReaction(target: ISlackReactionTarget) {
  return applyReaction('remove', target)
}

export async function updateSlackMessage(
  args: ChatUpdateArguments,
): Promise<{ ok: boolean; error?: string }> {
  const client = getBotClient()
  if (!client) {
    return { ok: false, error: 'Slack bot client not available' }
  }

  try {
    await client.chat.update({ ...args, token: undefined })
    return { ok: true }
  } catch (error) {
    log.error({ error, channel: args.channel, ts: args.ts }, 'Failed to update Slack bot message')
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
