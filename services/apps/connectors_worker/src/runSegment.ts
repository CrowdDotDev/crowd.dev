import type { AnyManifest } from '@crowd/connectors'

export function resolveRunSegmentId(
  integrationId: string,
  integration: { segmentId: string | null } | null,
  manifest: Pick<AnyManifest, 'emitsOwnSegment'>,
): string | null {
  if (integration?.segmentId) {
    return integration.segmentId
  }
  if (integration && manifest.emitsOwnSegment) {
    return null
  }
  throw new Error(`integration ${integrationId} not found or has no segmentId`)
}
