import { postSlackMessage } from './chatClient'

export interface ISlackPermalinkTarget {
  channel: string
  ts: string
  threadTs: string
}

export interface ISlackThreadReplyResult {
  ok: boolean
  error?: string
}

const PERMALINK_PATTERN =
  /^https:\/\/[^/]+\.slack\.com\/archives\/([A-Z0-9]+)\/p(\d{10})(\d{6})(?:\?(.*))?$/i

export function parseSlackPermalink(url: string): ISlackPermalinkTarget | null {
  const match = PERMALINK_PATTERN.exec(url)
  if (!match) {
    return null
  }

  const [, channel, seconds, micros, query] = match
  const ts = `${seconds}.${micros}`
  const threadTs = new URLSearchParams(query ?? '').get('thread_ts')

  return { channel, ts, threadTs: threadTs || ts }
}

export async function replyInSlackThread(
  permalink: string | null,
  text: string,
): Promise<ISlackThreadReplyResult> {
  const target = permalink ? parseSlackPermalink(permalink) : null
  if (!target) {
    return { ok: false, error: 'not a Slack message permalink' }
  }

  const result = await postSlackMessage({
    channel: target.channel,
    thread_ts: target.threadTs,
    text,
  })

  return result.ok ? { ok: true } : { ok: false, error: result.error }
}
