import { z } from 'zod'

import { MemberIdentityType, PlatformType } from '@crowd/types'

import type { OctolensMention } from './mentionsClient'

// Every Octolens source whose author is a real person (D23). Sources whose author is a show,
// publication or reviewer (podcasts, news, firehose, newsletter, review sites) are left out,
// so the mapper returns null and the poll skips and logs them.
const SOURCE_TO_PLATFORM: Record<string, PlatformType> = {
  github: PlatformType.GITHUB,
  twitter: PlatformType.TWITTER,
  linkedin: PlatformType.LINKEDIN,
  reddit: PlatformType.REDDIT,
  reddit_comment: PlatformType.REDDIT,
  dev: PlatformType.DEVTO,
  hackernews: PlatformType.HACKERNEWS,
  stackoverflow: PlatformType.STACKOVERFLOW,
  medium: PlatformType.MEDIUM,
  producthunt: PlatformType.PRODUCTHUNT,
  facebook: PlatformType.FACEBOOK,
  youtube: PlatformType.YOUTUBE,
  bluesky: PlatformType.BLUESKY,
  tiktok: PlatformType.TIKTOK,
  instagram: PlatformType.INSTAGRAM,
}

// First path segments on github.com that are never an owner, so `<segment>/<x>` is not a repo.
const GITHUB_NON_OWNER_PATHS = new Set([
  'about',
  'apps',
  'codespaces',
  'collections',
  'enterprise',
  'events',
  'explore',
  'features',
  'issues',
  'login',
  'marketplace',
  'new',
  'notifications',
  'orgs',
  'organizations',
  'pulls',
  'search',
  'settings',
  'solutions',
  'sponsors',
  'stars',
  'topics',
  'trending',
  'users',
])

// Matches the existing MENTION score already set for github/twitter/linkedin's own
// activity-scoring grids (all 6) — see services/libs/integrations/*/grid.ts.
const OCTOLENS_MENTION_SCORE = 6

const identitySchema = z.object({
  platform: z.string(),
  value: z.string(),
  type: z.string(),
  verified: z.boolean(),
})

const memberSchema = z.object({
  displayName: z.string(),
  identities: z.array(identitySchema).min(1),
  attributes: z.record(z.unknown()).optional(),
})

export const octolensActivitySchema = z.object({
  type: z.literal('mention'),
  platform: z.string(),
  timestamp: z.string(),
  sourceId: z.string(),
  score: z.number(),
  title: z.string().optional(),
  body: z.string().optional(),
  url: z.string().optional(),
  // Per-record channel (D26): emit keeps it instead of the sync unit's channel.
  channel: z.string().optional(),
  attributes: z.record(z.unknown()).optional(),
  member: memberSchema,
})

export type OctolensActivity = z.infer<typeof octolensActivitySchema>

export interface MappedOctolensMention {
  platform: PlatformType
  keywordId: number | undefined
  activity: OctolensActivity
}

export function mapMentionToActivity(mention: OctolensMention): MappedOctolensMention | null {
  const platform = SOURCE_TO_PLATFORM[mention.source.toLowerCase()]
  if (!platform) {
    return null
  }

  // YouTube's `author` is a display handle; the channel id in authorUrl is the stable identity.
  const identityValue =
    platform === PlatformType.YOUTUBE ? parseYoutubeChannelId(mention.authorUrl) : mention.author
  if (!identityValue) {
    return null
  }

  // Each attribute name is a top-level key, wrapped per-platform underneath — matches the
  // GitHub connector's own memberAttributesSchema shape, not { [platform]: { url, ... } }.
  const attributes: Record<string, unknown> = {}
  if (mention.authorUrl) attributes.url = { [platform]: mention.authorUrl }
  if (mention.authorAvatar) attributes.avatarUrl = { [platform]: mention.authorAvatar }

  // authorFollowers stays here, not on member.reach: Crustdata enrichment already writes
  // reach.linkedin from connections, and these per-mention snapshots can arrive out of order.
  const activityAttributes = withoutNullish({
    octolensMentionId: mention.id,
    authorFollowers: mention.authorFollowers,
    relevance: mention.relevance,
    relevanceScore: mention.relevanceScore,
    relevanceComment: mention.relevanceComment,
    sentiment: mention.sentiment,
    language: mention.language,
    tags: mention.tags,
    keywords: mention.keywords,
    keywordId: mention.keywordId,
    engaged: mention.engaged,
    isReply: mention.isReply,
    feedbackRelevant: mention.feedbackRelevant,
    imageUrl: mention.imageUrl,
    engagementMetrics: mention.engagementMetrics,
    engagementObservedAt: mention.engagementObservedAt,
    review: mention.review ? withoutNullish({ ...mention.review }) : undefined,
  })

  return {
    platform,
    keywordId: mention.keywordId,
    activity: {
      type: 'mention',
      platform,
      timestamp: toIsoTimestamp(mention.timestamp),
      sourceId: mention.sourceId,
      score: OCTOLENS_MENTION_SCORE,
      title: mention.title ?? undefined,
      body: mention.body ?? undefined,
      url: mention.url,
      channel: mentionChannel(platform, mention),
      attributes: Object.keys(activityAttributes).length > 0 ? activityAttributes : undefined,
      member: {
        displayName: mention.authorName || mention.author || identityValue,
        identities: [
          {
            platform,
            value: identityValue,
            type: MemberIdentityType.USERNAME,
            verified: true,
          },
        ],
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      },
    },
  }
}

// D27: github = the repo URL, reddit = the subreddit, everything else = the matched keyword.
function mentionChannel(platform: PlatformType, mention: OctolensMention): string | undefined {
  if (platform === PlatformType.GITHUB) {
    const repoUrl = parseGithubRepoUrl(mention.url)
    if (repoUrl) return repoUrl
  } else if (platform === PlatformType.REDDIT) {
    const subreddit = parseSubreddit(mention.url)
    if (subreddit) return subreddit
  }
  return matchedKeyword(mention)
}

function matchedKeyword(mention: OctolensMention): string | undefined {
  const keywords = Array.isArray(mention.keywords) ? mention.keywords : []
  const match = keywords.find((k) => k?.id === mention.keywordId) ?? keywords[0]
  const text = typeof match?.keyword === 'string' ? match.keyword.trim() : ''
  return text || undefined
}

function parseUrl(raw: string | null | undefined): URL | null {
  if (!raw) return null
  try {
    return new URL(raw)
  } catch {
    return null
  }
}

function pathSegments(url: URL): string[] {
  return url.pathname.split('/').filter((segment) => segment.length > 0)
}

// Keeps the url's own owner/repo casing; profiles, org pages and gists have no repo.
export function parseGithubRepoUrl(raw: string | null | undefined): string | undefined {
  const url = parseUrl(raw)
  if (!url || !['github.com', 'www.github.com'].includes(url.hostname.toLowerCase())) {
    return undefined
  }
  const [owner, rawRepo] = pathSegments(url)
  const repo = rawRepo?.replace(/\.git$/i, '')
  if (!owner || !repo || GITHUB_NON_OWNER_PATHS.has(owner.toLowerCase())) {
    return undefined
  }
  return `https://github.com/${owner}/${repo}`
}

export function parseSubreddit(raw: string | null | undefined): string | undefined {
  const url = parseUrl(raw)
  if (!url || !/(^|\.)reddit\.com$/i.test(url.hostname)) return undefined
  const segments = pathSegments(url)
  const index = segments.findIndex((segment) => segment.toLowerCase() === 'r')
  return index >= 0 ? segments[index + 1] : undefined
}

export function parseYoutubeChannelId(raw: string | null | undefined): string | undefined {
  const url = parseUrl(raw)
  if (!url || !/(^|\.)youtube\.com$/i.test(url.hostname)) return undefined
  const [first, channelId] = pathSegments(url)
  return first === 'channel' && channelId ? channelId : undefined
}

function withoutNullish(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined))
}

const OCTOLENS_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/

// Octolens returns "YYYY-MM-DD HH:mm:ss.SSS", UTC with no timezone suffix (confirmed
// against the live API docs) — append Z before parsing so Date treats it as UTC, not local.
export function toIsoTimestamp(raw: string): string {
  if (!OCTOLENS_TIMESTAMP_RE.test(raw)) {
    throw new Error(`octolens timestamp does not match the documented format: ${raw}`)
  }
  const iso = `${raw.replace(' ', 'T')}Z`
  const parsed = new Date(iso)
  // Date silently normalizes an invalid calendar date/time (e.g. 2026-02-30 -> Mar 2), so
  // verify the round trip matches instead of trusting a seemingly successful parse.
  if (parsed.toISOString() !== iso) {
    throw new Error(`octolens timestamp is not a valid calendar date/time: ${raw}`)
  }
  return iso
}
