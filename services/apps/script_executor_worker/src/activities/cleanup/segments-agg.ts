import { svc } from '../../main'

interface OrphanCleanupRun {
  id?: string
  tableName: string
  startedAt: Date
  completedAt?: Date
  status: 'running' | 'completed' | 'failed'
  orphansFound: number
  orphansDeleted: number
  executionTimeMs?: number
  errorMessage?: string
}

export async function startOrphanCleanupRun(tableName: string): Promise<string> {
  try {
    // First, mark any stale runs (running for more than 2 hours) as failed
    await svc.postgres.writer.connection().none(
      `
      UPDATE "orphanCleanupRuns"
      SET 
        "status" = 'failed',
        "completedAt" = NOW(),
        "errorMessage" = 'Cleanup run timed out or worker crashed',
        "executionTimeMs" = EXTRACT(EPOCH FROM (NOW() - "startedAt")) * 1000
      WHERE "tableName" = $1
        AND "status" = 'running'
        AND "startedAt" < NOW() - INTERVAL '2 hours'
      `,
      [tableName],
    )

    // Check if there's already a running cleanup for this table
    const existingRun = await svc.postgres.reader.connection().oneOrNone(
      `
      SELECT id, "startedAt"
      FROM "orphanCleanupRuns"
      WHERE "tableName" = $1
        AND "status" = 'running'
      LIMIT 1
      `,
      [tableName],
    )

    if (existingRun) {
      svc.log.warn(
        { tableName, existingRunId: existingRun.id },
        'Found existing running cleanup, reusing it',
      )
      return existingRun.id
    }

    // Create new cleanup run
    const result = await svc.postgres.writer.connection().one(
      `
      INSERT INTO "orphanCleanupRuns" (
        "tableName",
        "startedAt",
        "status",
        "orphansFound",
        "orphansDeleted"
      ) VALUES ($1, NOW(), 'running', 0, 0)
      RETURNING id
      `,
      [tableName],
    )
    return result.id
  } catch (error) {
    svc.log.error(error, 'Error starting orphan cleanup run!')
    throw error
  }
}

export async function updateOrphanCleanupRun(
  runId: string,
  updates: Partial<OrphanCleanupRun>,
): Promise<void> {
  try {
    const setClauses: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (updates.completedAt !== undefined) {
      setClauses.push(`"completedAt" = $${paramIndex++}`)
      values.push(updates.completedAt)
    }
    if (updates.status !== undefined) {
      setClauses.push(`"status" = $${paramIndex++}`)
      values.push(updates.status)
    }
    if (updates.orphansFound !== undefined) {
      setClauses.push(`"orphansFound" = $${paramIndex++}`)
      values.push(updates.orphansFound)
    }
    if (updates.orphansDeleted !== undefined) {
      setClauses.push(`"orphansDeleted" = $${paramIndex++}`)
      values.push(updates.orphansDeleted)
    }
    if (updates.executionTimeMs !== undefined) {
      setClauses.push(`"executionTimeMs" = $${paramIndex++}`)
      values.push(updates.executionTimeMs)
    }
    if (updates.errorMessage !== undefined) {
      setClauses.push(`"errorMessage" = $${paramIndex++}`)
      values.push(updates.errorMessage)
    }

    values.push(runId)

    await svc.postgres.writer.connection().none(
      `
      UPDATE "orphanCleanupRuns"
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      `,
      values,
    )
  } catch (error) {
    svc.log.error(error, 'Error updating orphan cleanup run!')
    throw error
  }
}

export async function getOrphanMembersSegmentsAgg(batchSize: number): Promise<string[]> {
  try {
    const result = await svc.postgres.reader.connection().any(
      `
      SELECT msa."memberId"
      FROM "memberSegmentsAgg" msa
      LEFT JOIN members m ON msa."memberId" = m.id
      WHERE m.id IS NULL
      LIMIT $1
      `,
      [batchSize],
    )
    return result.map((r) => r.memberId)
  } catch (error) {
    svc.log.error(error, 'Error getting orphan memberSegmentsAgg records!')
    throw error
  }
}

export async function deleteOrphanMembersSegmentsAgg(memberId: string): Promise<void> {
  try {
    await svc.postgres.writer.connection().none(
      `
      DELETE FROM "memberSegmentsAgg"
      WHERE "memberId" = $1
      `,
      [memberId],
    )
  } catch (error) {
    svc.log.error(error, 'Error deleting orphan memberSegmentsAgg record!')
    throw error
  }
}

export async function getOrphanOrganizationSegmentsAgg(batchSize: number): Promise<string[]> {
  try {
    const result = await svc.postgres.reader.connection().any(
      `
      SELECT osa."organizationId"
      FROM "organizationSegmentsAgg" osa
      LEFT JOIN organizations o ON osa."organizationId" = o.id
      WHERE o.id IS NULL
      LIMIT $1
      `,
      [batchSize],
    )
    return result.map((r) => r.organizationId)
  } catch (error) {
    svc.log.error(error, 'Error getting orphan organizationSegmentsAgg records!')
    throw error
  }
}

export async function deleteOrphanOrganizationSegmentsAgg(organizationId: string): Promise<void> {
  try {
    await svc.postgres.writer.connection().none(
      `
      DELETE FROM "organizationSegmentsAgg"
      WHERE "organizationId" = $1
      `,
      [organizationId],
    )
  } catch (error) {
    svc.log.error(error, 'Error deleting orphan organizationSegmentsAgg record!')
    throw error
  }
}
