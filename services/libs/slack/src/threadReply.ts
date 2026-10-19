import { ISlackMessageContent } from './blocks'
import { addSlackReaction, postSlackMessage, removeSlackReaction } from './chatClient'

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

export interface ISlackThreadPostResult extends ISlackThreadReplyResult {
  channel?: string
  ts?: string
}

export interface ISlackReactionChange {
  add: string[]
  remove: string[]
}

const NOT_A_PERMALINK = 'not a Slack message permalink'

export async function postSlackContentInThread(
  permalink: string | null,
  content: ISlackMessageContent,
): Promise<ISlackThreadPostResult> {
  const target = permalink ? parseSlackPermalink(permalink) : null
  if (!target) {
    return { ok: false, error: NOT_A_PERMALINK }
  }

  const result = await postSlackMessage({
    channel: target.channel,
    thread_ts: target.threadTs,
    ...content,
  })

  return result.ok
    ? { ok: true, channel: target.channel, ts: result.ts }
    : { ok: false, error: result.error }
}

export async function replyInSlackThread(
  permalink: string | null,
  text: string,
): Promise<ISlackThreadReplyResult> {
  const result = await postSlackContentInThread(permalink, { text })
  return result.ok ? { ok: true } : { ok: false, error: result.error }
}

export async function setSlackRequestReactions(
  permalink: string | null,
  { add, remove }: ISlackReactionChange,
): Promise<ISlackThreadReplyResult> {
  const target = permalink ? parseSlackPermalink(permalink) : null
  if (!target) {
    return { ok: false, error: NOT_A_PERMALINK }
  }

  const changes = [
    ...remove.map((name) =>
      removeSlackReaction({ channel: target.channel, timestamp: target.ts, name }),
    ),
    ...add.map((name) => addSlackReaction({ channel: target.channel, timestamp: target.ts, name })),
  ]
  const failed = (await Promise.all(changes)).find((result) => !result.ok)
  return failed ? { ok: false, error: failed.error } : { ok: true }
}
