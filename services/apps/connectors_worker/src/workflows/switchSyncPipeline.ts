import { log, proxyActivities, sleep } from '@temporalio/workflow'

import type * as activities from '../activities/switchSyncPipelineActivities'
import type { ISwitchRepoTarget } from '../activities/switchSyncPipelineActivities'
import type { ISwitchSyncResult, ISwitchSyncTarget, SwitchDirection } from '../syncPipelineSwitch'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
  },
})

const replayActivity = proxyActivities<Pick<typeof activities, 'replayShadowRecords'>>({
  startToCloseTimeout: '1 hour',
  heartbeatTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
  },
})

const DRAIN_POLL_INTERVAL = '30 seconds'
const DRAIN_MAX_POLLS = 120

export interface ISwitchSyncPipelineInput {
  owner: string
  repo: string
  direction: SwitchDirection
  syncNames?: string[]
}

export async function switchSyncPipeline(
  input: ISwitchSyncPipelineInput,
): Promise<ISwitchSyncResult[]> {
  const { target, syncs } = await activity.resolveSwitchTarget({
    owner: input.owner,
    repo: input.repo,
    syncNames: input.syncNames,
  })

  if (!target) {
    return syncs.map((sync) => ({
      syncName: sync.syncName,
      outcome: 'refused',
      reason: `no active github-nango mapping for ${input.owner}/${input.repo}`,
    }))
  }

  const results: ISwitchSyncResult[] = []
  for (const sync of syncs) {
    results.push(
      input.direction === 'connectors'
        ? await switchToConnectors(target, sync)
        : await switchToNango(target, sync),
    )
  }

  log.info('sync pipeline switch complete', { ...input, results })
  return results
}

async function switchToConnectors(
  target: ISwitchRepoTarget,
  sync: ISwitchSyncTarget,
): Promise<ISwitchSyncResult> {
  if (!sync.nangoSync) {
    return refused(sync, 'unknown github sync')
  }

  const gateInput = {
    integrationId: target.integrationId,
    connectionId: target.connectionId,
    channelName: target.channelName,
    syncName: sync.syncName,
  }
  const gate = await activity.evaluateForwardGate(gateInput)
  if (gate.ok === false && gate.outcome === 'refused') {
    return refused(sync, gate.reason)
  }
  if (gate.ok === false) {
    return gate.unitId
      ? healEmittingUnit(target, sync, gate.unitId, gate.reason)
      : refused(sync, gate.reason)
  }

  await activity.quiesceUnit({ unitId: gate.unitId })
  if (!(await drainUnit(gate.unitId))) {
    await activity.activateUnit({ unitId: gate.unitId })
    return refused(sync, 'unit still locked after the drain timeout; rerun')
  }

  const drainedGate = await activity.evaluateForwardGate(gateInput)
  if (drainedGate.ok === false) {
    await activity.activateUnit({ unitId: gate.unitId })
    return refused(sync, `unit changed while draining: ${drainedGate.reason}`)
  }

  try {
    await activity.pauseNangoRepoSync({
      connectionId: target.connectionId,
      nangoSync: sync.nangoSync,
    })
  } catch (err) {
    await activity.activateUnit({ unitId: gate.unitId })
    return refused(sync, `nango pause failed: ${describeFailure(err)}`)
  }

  try {
    await activity.setUnitEmitEnabled({ unitId: gate.unitId, emitEnabled: true })
  } catch (err) {
    return refused(
      sync,
      `nango paused but flag flip failed: ${describeFailure(err)}; rerun to retry`,
    )
  }

  return finishTakeover(sync, gate.unitId, 'switched')
}

async function healEmittingUnit(
  target: ISwitchRepoTarget,
  sync: ISwitchSyncTarget,
  unitId: string,
  reason: string,
): Promise<ISwitchSyncResult> {
  try {
    await activity.pauseNangoRepoSync({
      connectionId: target.connectionId,
      nangoSync: sync.nangoSync,
    })
  } catch (err) {
    return refused(sync, `nango pause failed: ${describeFailure(err)}`)
  }

  return finishTakeover(sync, unitId, 'unchanged', reason)
}

async function finishTakeover(
  sync: ISwitchSyncTarget,
  unitId: string,
  outcome: 'switched' | 'unchanged',
  reason?: string,
): Promise<ISwitchSyncResult> {
  let replayed: number
  try {
    replayed = await replayActivity.replayShadowRecords({ unitId })
  } catch (err) {
    return refused(
      sync,
      `emitting but shadow replay failed: ${describeFailure(err)}; rerun to finish`,
    )
  }

  await activity.activateUnit({ unitId })

  const detail = `${replayed} shadow records replayed`
  return { syncName: sync.syncName, outcome, reason: reason ? `${reason}; ${detail}` : detail }
}

async function drainUnit(unitId: string): Promise<boolean> {
  for (let poll = 0; poll < DRAIN_MAX_POLLS; poll += 1) {
    if (!(await activity.isUnitLocked({ unitId }))) {
      return true
    }
    await sleep(DRAIN_POLL_INTERVAL)
  }
  return false
}

async function switchToNango(
  target: ISwitchRepoTarget,
  sync: ISwitchSyncTarget,
): Promise<ISwitchSyncResult> {
  if (!sync.nangoSync) {
    return refused(sync, 'unknown github sync')
  }

  const gate = await activity.evaluateBackGate({
    integrationId: target.integrationId,
    connectionId: target.connectionId,
    channelName: target.channelName,
    syncName: sync.syncName,
  })
  if (gate.ok === false && gate.outcome === 'refused') {
    return refused(sync, gate.reason)
  }

  if (gate.ok === true) {
    try {
      await activity.setUnitEmitEnabled({ unitId: gate.unitId, emitEnabled: false })
    } catch (err) {
      return refused(sync, `flag flip failed: ${describeFailure(err)}`)
    }
  }
  if (gate.ok === true || gate.unitId) {
    await activity.activateUnit({ unitId: gate.ok === true ? gate.unitId : gate.unitId })
  }

  try {
    await activity.resumeNangoRepoSync({
      connectionId: target.connectionId,
      nangoSync: sync.nangoSync,
    })
  } catch (err) {
    return refused(
      sync,
      `flag is off but nango resume failed: ${describeFailure(err)}; rerun 'nango' to resend`,
    )
  }

  if (gate.ok === true) {
    return { syncName: sync.syncName, outcome: 'switched' }
  }

  return {
    syncName: sync.syncName,
    outcome: 'unchanged',
    reason: `${gate.reason} (resume re-sent)`,
  }
}

function refused(sync: ISwitchSyncTarget, reason: string): ISwitchSyncResult {
  return { syncName: sync.syncName, outcome: 'refused', reason }
}

function describeFailure(err: unknown): string {
  const cause = (err as { cause?: { message?: string } })?.cause
  return cause?.message ?? (err instanceof Error ? err.message : String(err))
}
