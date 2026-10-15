import type { OctolensFeed, OctolensFilterCondition } from './configClient'

// Must stay in step with the slug Insights' Tinybird pipeline extracts from this URL.
const INSIGHTS_WEBHOOK_RE = /^https:\/\/insights\.linuxfoundation\.org\/api\/community\/([^/?#]+)/

export function insightsSlugFromWebhookUrl(url: string | undefined): string | null {
  const match = url ? INSIGHTS_WEBHOOK_RE.exec(url) : null
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}

export type FeedKeywords =
  | { keywordIds: number[] }
  | {
      skipReason: 'unsupported keyword operator' | 'no keyword condition' | 'malformed keyword ids'
    }

// Any non-`in` Keywords operator, or no Keywords condition, has no clean keyword set: skip the feed
// rather than map every keyword to one project.
export function feedKeywordIds(feed: OctolensFeed): FeedKeywords {
  const conditions: OctolensFilterCondition[] = [
    ...(feed.simpleFilters?.conditions ?? []),
    ...(feed.advancedFilters?.groups ?? []).flatMap((group) => group.conditions ?? []),
  ].filter((condition) => condition.field === 'Keywords')

  const keywordIds = new Set<number>()
  for (const condition of conditions) {
    if ((condition.operator ?? 'in') !== 'in') {
      return { skipReason: 'unsupported keyword operator' }
    }
    for (const raw of String(condition.values).split(',')) {
      const value = raw.trim()
      if (!/^\d+$/.test(value)) {
        return { skipReason: 'malformed keyword ids' }
      }
      keywordIds.add(Number(value))
    }
  }

  if (keywordIds.size === 0) {
    return { skipReason: 'no keyword condition' }
  }
  return { keywordIds: [...keywordIds] }
}
