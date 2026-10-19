import { log, proxyActivities } from '@temporalio/workflow'

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

  const gate = await activity.evaluateForwardGate({
    integrationId: target.integrationId,
    channelName: target.channelName,
    syncName: sync.syncName,
  })
  if (gate.ok === false && gate.outcome === 'refused') {
    return refused(sync, gate.reason)
  }

  try {
    await activity.pauseNangoRepoSync({
      connectionId: target.connectionId,
      nangoSync: sync.nangoSync,
    })
  } catch (err) {
    return refused(sync, `nango pause failed: ${describeFailure(err)}`)
  }

  if (gate.ok === false) {
    return {
      syncName: sync.syncName,
      outcome: 'unchanged',
      reason: `${gate.reason} (pause re-sent)`,
    }
  }

  try {
    await activity.setUnitEmitEnabled({ unitId: gate.unitId, emitEnabled: true })
  } catch (err) {
    return refused(
      sync,
      `nango paused but flag flip failed: ${describeFailure(err)}; rerun to retry`,
    )
  }

  return { syncName: sync.syncName, outcome: 'switched' }
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
