import { assertCredentialKind } from '../../../types'
import type { SyncContext, SyncOutcome } from '../../../types'
import { fetchFeeds, fetchKeywords, fetchNotifications } from '../configClient'
import type { OctolensDeps } from '../deps'
import { feedKeywordIds, insightsSlugFromWebhookUrl } from '../mappingRules'

export async function runMappingDiscovery(ctx: SyncContext<OctolensDeps>): Promise<SyncOutcome> {
  const credential = await ctx.getCredential()
  assertCredentialKind(credential, 'octolens-token')
  const { token } = credential.data

  const notifications = await fetchNotifications(token)
  const feeds = new Map((await fetchFeeds(token)).map((feed) => [feed.id, feed]))
  const keywords = new Map((await fetchKeywords(token)).map((keyword) => [keyword.id, keyword]))

  // A notification whose feed is missing means Octolens returned an inconsistent snapshot,
  // so this run must not deactivate anything based on it.
  let complete = true
  let pausedNotifications = 0
  let mappedFeeds = 0
  let skippedFeeds = 0
  const slugsByKeyword = new Map<number, Set<string>>()

  for (const notification of notifications) {
    const slugs = (notification.destinations ?? [])
      .filter((destination) => destination.type === 'WEBHOOK')
      .map((destination) => insightsSlugFromWebhookUrl(destination.webhookDestination?.url))
      .filter((slug): slug is string => slug !== null)
    if (slugs.length === 0) continue

    if (!notification.enabled) {
      pausedNotifications += 1
      continue
    }

    const feed = feeds.get(notification.feedId)
    if (!feed) {
      complete = false
      ctx.log.warn(
        { notificationId: notification.id, feedId: notification.feedId },
        'octolens mapping discovery: notification references a missing feed',
      )
      continue
    }

    const result = feedKeywordIds(feed)
    if ('skipReason' in result) {
      skippedFeeds += 1
      // Unlike a deliberate filter shape, malformed ids are a contract break: don't reconcile on them.
      if (result.skipReason === 'malformed keyword ids') complete = false
      ctx.log.warn(
        { feedId: feed.id, feedName: feed.name, slugs, reason: result.skipReason },
        'octolens mapping discovery: skipping feed',
      )
      continue
    }

    mappedFeeds += 1
    for (const keywordId of result.keywordIds) {
      const keywordSlugs = slugsByKeyword.get(keywordId) ?? new Set<string>()
      slugs.forEach((slug) => keywordSlugs.add(slug))
      slugsByKeyword.set(keywordId, keywordSlugs)
    }
  }

  const segmentBySlug = new Map<string, string | null>()
  const seenKeywordIds: number[] = []
  for (const [keywordId, slugs] of slugsByKeyword) {
    if (slugs.size > 1) {
      ctx.log.warn(
        { keywordId, slugs: [...slugs] },
        'octolens mapping discovery: keyword reaches several projects, not mapping it',
      )
      continue
    }

    const [slug] = slugs
    if (!segmentBySlug.has(slug)) {
      segmentBySlug.set(slug, await ctx.deps.resolveProjectSegmentId(slug))
    }
    const segmentId = segmentBySlug.get(slug)
    if (!segmentId) {
      ctx.log.warn(
        { keywordId, slug },
        'octolens mapping discovery: slug does not resolve to a project segment',
      )
      continue
    }

    const keyword = keywords.get(keywordId)
    if (!keyword) {
      ctx.log.warn(
        { keywordId, slug },
        'octolens mapping discovery: feed references unknown keyword',
      )
      continue
    }

    await ctx.deps.upsertMapping({ keywordId, keyword: keyword.keyword, segmentId })
    seenKeywordIds.push(keywordId)
  }

  const unreachedKeywords = [...keywords.values()]
    .filter((keyword) => !slugsByKeyword.has(keyword.id))
    .map((keyword) => ({ id: keyword.id, keyword: keyword.keyword, paused: keyword.paused }))
  if (unreachedKeywords.length > 0) {
    ctx.log.info(
      { unreachedKeywords },
      'octolens mapping discovery: keywords no project webhook reaches',
    )
  }

  let deactivated = 0
  if (!complete) {
    ctx.log.warn('octolens mapping discovery: incomplete snapshot, skipping deactivation')
  } else if (seenKeywordIds.length === 0) {
    ctx.log.warn('octolens mapping discovery: no mappings found, skipping deactivation')
  } else {
    deactivated = await ctx.deps.deactivateMappingsNotSeen(seenKeywordIds)
  }

  ctx.log.info(
    {
      notifications: notifications.length,
      pausedNotifications,
      mappedFeeds,
      skippedFeeds,
      mappings: seenKeywordIds.length,
      deactivated,
      unreachedKeywords: unreachedKeywords.length,
    },
    'octolens mapping discovery complete',
  )
  return { complete: true }
}
