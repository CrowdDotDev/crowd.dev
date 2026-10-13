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
  member: memberSchema,
})

export type OctolensActivity = z.infer<typeof octolensActivitySchema>

export interface MappedOctolensMention {
  platform: PlatformType
  keywordId: number
  activity: OctolensActivity
}

export function mapMentionToActivity(mention: OctolensMention): MappedOctolensMention | null {
  const platform = SOURCE_TO_PLATFORM[mention.source.toLowerCase()]
  if (!platform || !mention.author) {
    return null
  }

  const attributes: Record<string, unknown> = {}
  if (mention.authorUrl) attributes.url = mention.authorUrl
  if (mention.authorAvatar) attributes.avatarUrl = mention.authorAvatar

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
        attributes: Object.keys(attributes).length > 0 ? { [platform]: attributes } : undefined,
      },
    },
  }
}

// Octolens returns "YYYY-MM-DD HH:mm:ss.SSS", UTC with no timezone suffix (confirmed
// against the live API docs) — append Z before parsing so Date treats it as UTC, not local.
export function toIsoTimestamp(raw: string): string {
  return new Date(`${raw.replace(' ', 'T')}Z`).toISOString()
}
