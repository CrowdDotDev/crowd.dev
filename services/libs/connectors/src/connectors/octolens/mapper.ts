import { z } from 'zod'

import { MemberIdentityType, PlatformType } from '@crowd/types'

import type { OctolensMention } from './mentionsClient'

// Only these 3 of Octolens's ~13 source values are supported (D8); the rest are skipped
// and logged in the mapper below, not thrown.
const SOURCE_TO_PLATFORM: Record<string, PlatformType> = {
  github: PlatformType.GITHUB,
  twitter: PlatformType.TWITTER,
  linkedin: PlatformType.LINKEDIN,
}

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
  if (!platform || !mention.author) {
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
    review: mention.review,
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
      attributes: Object.keys(activityAttributes).length > 0 ? activityAttributes : undefined,
      member: {
        displayName: mention.authorName ?? mention.author,
        identities: [
          {
            platform,
            value: mention.author,
            type: MemberIdentityType.USERNAME,
            verified: true,
          },
        ],
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      },
    },
  }
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
