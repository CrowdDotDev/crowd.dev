import {
  InsightsProjectField,
  queryInsightsProjects,
} from '@crowd/data-access-layer/src/collections'
import {
  deactivateOctolensKeywordMappingsNotSeen,
  listOctolensKeywordMappings,
  upsertOctolensKeywordMapping,
} from '@crowd/data-access-layer/src/octolens'
import { findSegmentById, isSegmentSubproject } from '@crowd/data-access-layer/src/segments'

import type { DepsFactoryInput } from '../../types'

export interface OctolensKeywordMappingInput {
  keywordId: number
  keyword: string
  segmentId: string
}

export interface OctolensDeps {
  resolveSegmentId(keywordId: number): Promise<string | null>
  // Activities only land on subproject segments, so a slug resolving to anything else is unusable.
  resolveProjectSegmentId(slug: string): Promise<string | null>
  upsertMapping(mapping: OctolensKeywordMappingInput): Promise<void>
  deactivateMappingsNotSeen(seenKeywordIds: number[]): Promise<number>
}

export function createOctolensDeps({ qx, integrationId }: DepsFactoryInput): OctolensDeps {
  let keywordSegments: Map<number, string> | null = null

  return {
    async resolveSegmentId(keywordId) {
      if (!keywordSegments) {
        const mappings = await listOctolensKeywordMappings(qx, integrationId)
        keywordSegments = new Map(mappings.map((m) => [m.keywordId, m.segmentId]))
      }
      return keywordSegments.get(keywordId) ?? null
    },

    async resolveProjectSegmentId(slug) {
      const [project] = await queryInsightsProjects(qx, {
        fields: [InsightsProjectField.SEGMENT_ID],
        filter: { slug: { eq: slug } },
        limit: 1,
      })
      if (!project?.segmentId) return null

      const segment = await findSegmentById(qx, project.segmentId)
      return segment && isSegmentSubproject(segment) ? segment.id : null
    },

    async upsertMapping(mapping) {
      await upsertOctolensKeywordMapping(qx, { integrationId, ...mapping })
    },

    async deactivateMappingsNotSeen(seenKeywordIds) {
      return deactivateOctolensKeywordMappingsNotSeen(qx, integrationId, seenKeywordIds)
    },
  }
}
