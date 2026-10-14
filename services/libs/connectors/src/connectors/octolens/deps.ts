import { listOctolensKeywordMappings } from '@crowd/data-access-layer/src/octolens'

import type { DepsFactoryInput } from '../../types'

export interface OctolensDeps {
  resolveSegmentId(keywordId: number): Promise<string | null>
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
  }
}
