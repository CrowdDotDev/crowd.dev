import { IMember } from '@crowd/types'

import { svc } from '../../main'
import { mergeMembers } from '../common'

export interface IMemberWithoutIdentity {
  id: string
  displayName: string
  createdAt: Date
  tenantId: string
}

export interface IMemberMatch {
  sourceId: string // member without identity
  targetId: string // member with identity to merge into
}

export interface ProcessingStats {
  totalProcessed: number
  totalMerged: number
  remainingMembers: number
  batchesProcessed: number
}

export async function findMembersWithoutIdentities(
  limit: number,
  offset: number,
  cutoffDate = '2025-05-18',
): Promise<IMemberWithoutIdentity[]> {
  try {
    const query = `
      SELECT m.id, m."displayName", m."createdAt", m."tenantId"
      FROM members m
      WHERE m."createdAt" > $1
        AND NOT EXISTS (
          SELECT 1
          FROM "memberIdentities" mi
          WHERE mi."memberId" = m.id
        )
      ORDER BY m."createdAt" DESC
      LIMIT $2
      OFFSET $3
    `
    const result = await svc.postgres.reader.connection().query(query, [cutoffDate, limit, offset])
    return result.rows
  } catch (error) {
    svc.log.error(error, 'Error finding members without identities!')
    throw error
  }
}

export async function findMatchingMemberWithIdentities(
  displayName: string,
  tenantId: string,
): Promise<IMember | null> {
  try {
    const query = `
      SELECT DISTINCT m.*
      FROM members m
      INNER JOIN "memberIdentities" mi ON mi."memberId" = m.id
      WHERE m."displayName" = $1
        AND m."tenantId" = $2
      ORDER BY m."createdAt" DESC
      LIMIT 1
    `
    const result = await svc.postgres.reader.connection().query(query, [displayName, tenantId])
    return result.rows[0] || null
  } catch (error) {
    svc.log.error(error, 'Error finding matching member with identities!')
    throw error
  }
}

export async function mergeMember(primaryId: string, secondaryId: string): Promise<void> {
  try {
    svc.log.info(`Merging member ${secondaryId} into ${primaryId}`)

    await mergeMembers(primaryId, secondaryId)

    svc.log.info(`Successfully merged member ${secondaryId} into ${primaryId}`)
  } catch (error) {
    svc.log.error(error, `Error merging member ${secondaryId} into ${primaryId}!`)
    throw error
  }
}

export async function processMemberBatch(
  limit = 1000,
  offset = 0,
  cutoffDate = '2025-05-18',
): Promise<{
  processed: number
  merged: number
  lastOffset: number
}> {
  const members = await findMembersWithoutIdentities(limit, offset, cutoffDate)
  let merged = 0

  for (const member of members) {
    try {
      const matchingMember = await findMatchingMemberWithIdentities(
        member.displayName,
        member.tenantId,
      )

      if (matchingMember) {
        await mergeMember(matchingMember.id, member.id)
        merged++
      }
    } catch (error) {
      svc.log.error(error, `Error processing member ${member.id}`)
      // Continue with next member even if one fails
      continue
    }
  }

  return {
    processed: members.length,
    merged,
    lastOffset: offset + members.length,
  }
}

async function getTotalMembersWithoutIdentities(cutoffDate = '2025-05-18'): Promise<number> {
  try {
    const query = `
      SELECT COUNT(*) as total
      FROM members m
      WHERE m."createdAt" > $1
        AND NOT EXISTS (
          SELECT 1
          FROM "memberIdentities" mi
          WHERE mi."memberId" = m.id
        )
    `
    const result = await svc.postgres.reader.connection().query(query, [cutoffDate])
    return parseInt(result.rows[0].total, 10)
  } catch (error) {
    svc.log.error(error, 'Error counting members without identities!')
    throw error
  }
}

export async function processMembersInBatches(
  batchSize = 1000,
  cutoffDate = '2025-05-18',
  progressCallback?: (stats: ProcessingStats) => Promise<void>,
): Promise<ProcessingStats> {
  const totalMembers = await getTotalMembersWithoutIdentities(cutoffDate)
  let offset = 0
  let totalProcessed = 0
  let totalMerged = 0
  let batchesProcessed = 0

  svc.log.info(
    `Starting to process ${totalMembers} members without identities in batches of ${batchSize}`,
  )

  while (offset < totalMembers) {
    const batchResult = await processMemberBatch(batchSize, offset, cutoffDate)

    totalProcessed += batchResult.processed
    totalMerged += batchResult.merged
    offset = batchResult.lastOffset
    batchesProcessed++

    const stats: ProcessingStats = {
      totalProcessed,
      totalMerged,
      remainingMembers: totalMembers - totalProcessed,
      batchesProcessed,
    }

    svc.log.info(
      `Processed batch ${batchesProcessed}: ${batchResult.processed} members, ${batchResult.merged} merged. ` +
        `Total progress: ${totalProcessed}/${totalMembers} (${totalMerged} merged)`,
    )

    // If a progress callback is provided, call it with the current stats
    if (progressCallback) {
      await progressCallback(stats)
    }

    // Small delay to prevent overwhelming the database
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return {
    totalProcessed,
    totalMerged,
    remainingMembers: totalMembers - totalProcessed,
    batchesProcessed,
  }
}
