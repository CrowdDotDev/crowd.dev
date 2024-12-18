import axios from 'axios'

import { RateLimitError } from '@crowd/types'

import { IProcessStreamContext } from '../../types'

import { GithubPlatformSettings, Repos } from './types'

const DAILY_CAP = 100
const TOTAL_CAP = 1000

const DAILY_CAP_KEY = 'github_archive_daily_count'
const TOTAL_CAP_KEY = 'github_archive_total_count'

export class TotalCapError extends Error {
  constructor() {
    super('Total cap limit reached')
    this.name = 'TotalCapError'
  }
}

export const sendTelegramMessage = async (token: string, chatId: string, message: string) => {
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`
    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    })
  } catch (error) {
    console.error('Error sending telegram message:', error)
  }
}

// @eslint-disable-next-line @typescript-eslint/no-explicit-any
export const capGithubArchive = async (ctx: IProcessStreamContext, repos: Repos) => {
  const cache = ctx.globalCache
  const dailyCount = Number(await cache.get(DAILY_CAP_KEY)) || 0
  const totalCount = Number(await cache.get(TOTAL_CAP_KEY)) || 0
  const increment = repos.length

  const settings = ctx.platformSettings as GithubPlatformSettings

  const tgNotifierToken = settings.tgNotifierToken
  const tgNotifierChatId = settings.tgNotifierChatId

  const newDailyCount = dailyCount + increment
  const newTotalCount = totalCount + increment

  if (newDailyCount > DAILY_CAP) {
    await sendTelegramMessage(
      tgNotifierToken,
      tgNotifierChatId,
      `⚠️ Daily cap limit reached for GitHub Archive\nDaily count: ${newDailyCount}/${DAILY_CAP}. \n Integration: ${ctx.integration.id}`,
    )
    throw new RateLimitError(24 * 60 * 60, 'Daily cap limit for GitHub Archive reached') // 24 hours in seconds
  }

  if (newTotalCount > TOTAL_CAP) {
    await sendTelegramMessage(
      tgNotifierToken,
      tgNotifierChatId,
      `🚫 Total cap limit reached for GitHub Archive\nTotal count: ${newTotalCount}/${TOTAL_CAP}. \n Integration: ${ctx.integration.id}`,
    )
    throw new TotalCapError()
  }

  await cache.set(DAILY_CAP_KEY, newDailyCount.toString(), 24 * 60 * 60) // 24 hour TTL
  await cache.set(TOTAL_CAP_KEY, newTotalCount.toString(), 24 * 60 * 60 * 365) // a year

  if (ctx.onboarding) {
    await sendTelegramMessage(
      tgNotifierToken,
      tgNotifierChatId,
      `🆕 Onboarding started for ${ctx.integration.id} with ${repos.length} repos:\n ${repos.map((r) => r.url).join('\n')}`,
    )
    await sendTelegramMessage(
      tgNotifierToken,
      tgNotifierChatId,
      `🔥 GitHub Archive cap stats\nDaily count: ${newDailyCount}/${DAILY_CAP}\nTotal count: ${newTotalCount}/${TOTAL_CAP}`,
    )
  }

  return {
    dailyCount: newDailyCount,
    totalCount: newTotalCount,
  }
}
