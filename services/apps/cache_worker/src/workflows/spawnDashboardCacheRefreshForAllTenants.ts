import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  executeChild,
  proxyActivities,
  startChild,
  workflowInfo,
} from '@temporalio/workflow'

import { ISegment } from '@crowd/data-access-layer/src/old/apps/cache_worker/types'

import * as activities from '../activities/getTenantSegmentInfo'

import { refreshDashboardCache } from './refreshDashboardCache'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function spawnDashboardCacheRefreshForAllTenants(): Promise<void> {
  const tenants = await activity.getAllTenants()
  const segmentsEnabled = await activity.isSegmentsEnabled()
  const info = workflowInfo()

  if (segmentsEnabled) {
    // we should spawn refreshDashboardCache for each tenant-segment couples

    const SEGMENT_PAGE_SIZE = 250

    for (const tenant of tenants) {
      // get all segments in tenant
      let offset = 0
      let segments: ISegment[]
      const segmentLeafIdMap = new Map<string, string[]>()

      do {
        segments = await activity.getAllSegments(tenant.tenantId, SEGMENT_PAGE_SIZE, offset)

        // find each segment's associated leaf segment
        for (const segment of segments) {
          if (segment.slug && segment.parentSlug && segment.grandparentSlug) {
            // it's already a leaf segment, add itself to leaf segment id map
            segmentLeafIdMap.set(segment.segmentId, [segment.segmentId])
          } else if (segment.slug && segment.parentSlug && !segment.grandparentSlug) {
            // it's a parent segment, find its leafs
            const leafs = await activity.getProjectLeafSegments(segment.slug, tenant.tenantId)
            if (leafs && leafs.length > 0) {
              segmentLeafIdMap.set(
                segment.segmentId,
                leafs.map((l) => l.segmentId),
              )
            }
          } else if (segment.slug && !segment.parentSlug && !segment.grandparentSlug) {
            // it's a grandparent segment, find its leafs
            const leafs = await activity.getProjectGroupLeafSegments(segment.slug, tenant.tenantId)
            if (leafs && leafs.length > 0) {
              segmentLeafIdMap.set(
                segment.segmentId,
                leafs.map((l) => l.segmentId),
              )
            }
          }
        }

        offset += SEGMENT_PAGE_SIZE
      } while (segments.length > 0)

      // execute each child with batcheds of 50
      const CHUNK_SIZE = 50
      const entries = [...segmentLeafIdMap] // Convert map entries into an Array
      const chunked: Map<string, string[]>[] = []

      for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
        const chunk = new Map(entries.slice(i, i + CHUNK_SIZE)) // Create new Map(s) with the chunked entries
        chunked.push(chunk)
      }

      for (const chunk of chunked) {
        // create a workflow for each tenantId-segmentId couple
        await Promise.all(
          Array.from(chunk).map(([segmentId, leafSegmentIds]) => {
            return executeChild(refreshDashboardCache, {
              workflowId: `${info.workflowId}/${tenant.tenantId}/${segmentId}`,
              cancellationType: ChildWorkflowCancellationType.ABANDON,
              parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
              retry: {
                backoffCoefficient: 2,
                initialInterval: 2 * 1000,
                maximumInterval: 30 * 1000,
              },
              args: [
                {
                  tenantId: tenant.tenantId,
                  segmentId,
                  leafSegmentIds,
                },
              ],
              searchAttributes: {
                TenantId: [tenant.tenantId],
              },
            })
          }),
        )
      }
    }
  } else {
    await Promise.all(
      tenants.map((tenant) => {
        return startChild(refreshDashboardCache, {
          workflowId: `${info.workflowId}/${tenant.tenantId}`,
          cancellationType: ChildWorkflowCancellationType.ABANDON,
          parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
          retry: {
            backoffCoefficient: 2,
            initialInterval: 2 * 1000,
            maximumInterval: 30 * 1000,
          },
          args: [
            {
              tenantId: tenant.tenantId,
            },
          ],
          searchAttributes: {
            TenantId: [tenant.tenantId],
          },
        })
      }),
    )
  }
}
