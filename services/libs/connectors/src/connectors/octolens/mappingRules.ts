import type { OctolensFeed, OctolensFilterCondition } from './configClient'

// Insights' webhook receiver, the same slug its Tinybird pipeline uses for project matching.
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

// Union of every Keywords `in` value, simple or advanced, regardless of AND/OR nesting (D16).
// Any other operator on Keywords (e.g. `not in`) has no clean keyword set, so the feed is skipped,
// and so is a feed without a Keywords condition: it would otherwise map every keyword to one project.
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
