/**
 * TEST ONLY - Calculate leaf segment (subproject) aggregates from activityRelations.
 *
 * This activity is for local testing ONLY when Tinybird data is not available.
 * In production, leaf segment aggregates come from Tinybird via Kafka Connect.
 *
 * Can be triggered manually via Temporal UI for testing the aggregate calculation flow.
 */
import { calculateAllMemberLeafAggregates as calculateAllMemberLeafAggregatesDAL } from '@crowd/data-access-layer/src/members/segments'
import { calculateAllOrganizationLeafAggregates as calculateAllOrganizationLeafAggregatesDAL } from '@crowd/data-access-layer/src/organizations/segments'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'

import { svc } from '../../main'

/**
 * Calculate and insert leaf segment aggregates for ALL members from activityRelations.
 * This queries activityRelations grouped by (memberId, segmentId) and inserts into memberSegmentsAgg.
 * Processes in batches to avoid memory issues with large datasets.
 *
 * @returns Number of aggregate rows inserted/updated
 */
export async function calculateAllMemberLeafAggregates(): Promise<number> {
  const readQx = pgpQx(svc.postgres.reader.connection())
  const writeQx = pgpQx(svc.postgres.writer.connection())

  console.log('Calculating leaf segment aggregates for all members from activityRelations...')

  const totalProcessed = await calculateAllMemberLeafAggregatesDAL(
    readQx,
    writeQx,
    10000,
    (batchNumber, total) => {
      console.log(`Processed batch ${batchNumber}, total: ${total} member aggregates`)
    },
  )

  console.log(`Completed inserting ${totalProcessed} member leaf segment aggregates`)
  return totalProcessed
}

/**
 * Calculate and insert leaf segment aggregates for ALL organizations from activityRelations.
 * This queries activityRelations grouped by (organizationId, segmentId) and inserts into organizationSegmentsAgg.
 * Processes in batches to avoid memory issues with large datasets.
 *
 * @returns Number of aggregate rows inserted/updated
 */
export async function calculateAllOrganizationLeafAggregates(): Promise<number> {
  const readQx = pgpQx(svc.postgres.reader.connection())
  const writeQx = pgpQx(svc.postgres.writer.connection())

  console.log('Calculating leaf segment aggregates for all organizations from activityRelations...')

  const totalProcessed = await calculateAllOrganizationLeafAggregatesDAL(
    readQx,
    writeQx,
    10000,
    (batchNumber, total) => {
      console.log(`Processed batch ${batchNumber}, total: ${total} organization aggregates`)
    },
  )

  console.log(`Completed inserting ${totalProcessed} organization leaf segment aggregates`)
  return totalProcessed
}
