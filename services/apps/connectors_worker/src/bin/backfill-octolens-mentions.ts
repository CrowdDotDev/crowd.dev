import { WRITE_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import {
  listActiveOctolensKeywordMappings,
  listOctolensMentionPollUnits,
  queueOctolensKeywordBackfills,
  rewindOctolensMentionPollStartDate,
} from '@crowd/data-access-layer/src/octolens'
import type {
  IOctolensMentionPollUnit,
  IOctolensMentionPollWriteResult,
} from '@crowd/data-access-layer/src/octolens'
import type { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getServiceLogger } from '@crowd/logging'
import { TEMPORAL_CONFIG, WorkflowNotFoundError, getTemporalClient } from '@crowd/temporal'

import {
  OCTOLENS_BACKFILL_USAGE,
  parseOctolensBackfillArgs,
  planOctolensBackfill,
} from '../octolensBackfill'
import type { OctolensBackfillArgs, OctolensBackfillPlan } from '../octolensBackfill'
import { syncRunWorkflowId } from '../syncRunWorkflowId'

const log = getServiceLogger()

const RETRY_HINT = 'retry in a few minutes, once the current mention poll run has finished'

function parseArgsOrExit(): OctolensBackfillArgs {
  try {
    return parseOctolensBackfillArgs(process.argv.slice(2), new Date())
  } catch (err) {
    log.error((err as Error).message)
    log.error(OCTOLENS_BACKFILL_USAGE)
    process.exit(1)
  }
}

async function loadPlan(qx: QueryExecutor, args: OctolensBackfillArgs) {
  const [units, mappings] = await Promise.all([
    listOctolensMentionPollUnits(qx),
    listActiveOctolensKeywordMappings(qx),
  ])
  const activeMappingCounts = new Map<number, number>()
  for (const { keywordId } of mappings) {
    activeMappingCounts.set(keywordId, (activeMappingCounts.get(keywordId) ?? 0) + 1)
  }
  return planOctolensBackfill(args, { units, activeMappingCounts })
}

// The dispatcher clears lockedAt when it re-claims a unit whose run outlived the claim lease,
// so only Temporal knows a long run is still going and will overwrite the watermark at its end.
async function isRunInFlight(unit: IOctolensMentionPollUnit): Promise<boolean> {
  const temporal = await getTemporalClient(TEMPORAL_CONFIG())
  const workflowId = syncRunWorkflowId(unit)
  try {
    const description = await temporal.workflow.getHandle(workflowId).describe()
    return description.status.name === 'RUNNING'
  } catch (err) {
    if (err instanceof WorkflowNotFoundError) return false
    throw err
  }
}

function describePlan(plan: OctolensBackfillPlan): Record<string, unknown> {
  const base = { unitId: plan.unit.id, integrationId: plan.unit.integrationId }
  if (plan.mode === 'keywords') {
    return {
      ...base,
      keywordIdsToQueue: plan.keywordIdsToQueue,
      alreadyQueued: plan.alreadyQueued,
      currentBackfill: plan.unit.watermark?.backfill ?? [],
    }
  }
  return {
    ...base,
    previousStartDate: plan.previousStartDate,
    startDate: plan.startDate,
    droppedCursor: plan.unit.watermark?.cursor ?? null,
    droppedPendingMaxTimestamp: plan.unit.watermark?.pendingMaxTimestamp ?? null,
  }
}

function applyPlan(
  qx: QueryExecutor,
  plan: OctolensBackfillPlan,
): Promise<IOctolensMentionPollWriteResult> {
  if (plan.mode === 'keywords') {
    return queueOctolensKeywordBackfills(qx, plan.unit.id, plan.keywordIdsToQueue)
  }
  return rewindOctolensMentionPollStartDate(qx, plan.unit.id, plan.startDate)
}

setImmediate(async () => {
  const args = parseArgsOrExit()
  try {
    const qx = pgpQx(await getDbConnection(WRITE_DB_CONFIG()))
    const plan = await loadPlan(qx, args)
    const summary = describePlan(plan)

    if (plan.mode === 'keywords' && plan.keywordIdsToQueue.length === 0) {
      log.info(summary, 'nothing to do: every keyword is already queued for backfill')
      process.exit(0)
    }

    const busy = plan.unit.lockedAt !== null || (await isRunInFlight(plan.unit))

    if (args.dryRun) {
      log.info({ ...summary, busy }, 'dry run: would update the octolens mention poll watermark')
      if (busy) {
        log.warn(`a mention poll run is in progress, a real run would refuse now: ${RETRY_HINT}`)
      }
      process.exit(0)
    }

    if (busy) {
      log.error(summary, `refused: a mention poll run is in progress; ${RETRY_HINT}`)
      process.exit(2)
    }

    const result = await applyPlan(qx, plan)
    if (result.outcome === 'locked') {
      log.error(summary, `refused: a mention poll run claimed the unit just now; ${RETRY_HINT}`)
      process.exit(2)
    }
    if (result.outcome !== 'applied') {
      log.error(
        { ...summary, outcome: result.outcome },
        'refused: the sync unit is no longer active or was removed',
      )
      process.exit(1)
    }

    log.info(
      { ...summary, watermark: result.watermark },
      'octolens mention poll watermark updated; the next poll runs pick it up',
    )
    process.exit(0)
  } catch (err) {
    log.error(err, 'octolens mention backfill failed')
    process.exit(1)
  }
})
