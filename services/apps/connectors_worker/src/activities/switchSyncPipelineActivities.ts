import {
  findSyncUnitByChannelName,
  getSyncDiffCountsForDays,
  setSyncUnitEmitEnabled,
} from '@crowd/data-access-layer/src/connectors'
import { findActiveNangoMappingForRepo } from '@crowd/data-access-layer/src/integrations'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import {
  NangoIntegration,
  githubChannelName,
  initNangoCloudClient,
  pauseNangoSync,
  startNangoSync,
} from '@crowd/nango'

import { svc } from '../main'
import {
  evaluateBackUnitGate,
  evaluateDiffCleanliness,
  evaluateForwardUnitGate,
  recentDiffedDays,
  resolveSwitchTargets,
} from '../syncPipelineSwitch'
import type { IGateRefusal, ISwitchSyncTarget } from '../syncPipelineSwitch'

const PLATFORM = 'github'
const SWITCH_EVENT = 'sync_pipeline_switch'

export interface ISwitchRepoTarget {
  integrationId: string
  connectionId: string
  channelName: string
}

export interface IResolveSwitchTargetInput {
  owner: string
  repo: string
  syncNames?: string[]
}

export interface IResolveSwitchTargetResult {
  target: ISwitchRepoTarget | null
  syncs: ISwitchSyncTarget[]
}

export interface IUnitGateInput {
  integrationId: string
  channelName: string
  syncName: string
}

export type IUnitGateResult = { ok: true; unitId: string } | IGateRefusal

export interface INangoSyncInput {
  connectionId: string
  nangoSync: string
}

export interface ISetUnitEmitEnabledInput {
  unitId: string
  emitEnabled: boolean
}

export async function resolveSwitchTarget(
  input: IResolveSwitchTargetInput,
): Promise<IResolveSwitchTargetResult> {
  const qx = dbStoreQx(svc.postgres.writer)
  const mapping = await findActiveNangoMappingForRepo(qx, input.owner, input.repo)
  const syncs = resolveSwitchTargets(input.syncNames)

  if (!mapping) {
    return { target: null, syncs }
  }

  return {
    target: {
      integrationId: mapping.integrationId,
      connectionId: mapping.connectionId,
      channelName: githubChannelName(mapping.owner, mapping.repoName),
    },
    syncs,
  }
}

export async function evaluateForwardGate(input: IUnitGateInput): Promise<IUnitGateResult> {
  const qx = dbStoreQx(svc.postgres.writer)
  const unit = await findSyncUnitByChannelName(
    qx,
    input.integrationId,
    PLATFORM,
    input.channelName,
    input.syncName,
  )

  const unitGate = evaluateForwardUnitGate(unit)
  if (unitGate.ok === false) {
    return unitGate
  }

  const days = recentDiffedDays(new Date())
  const rows = await getSyncDiffCountsForDays(qx, unit.id, days)
  const diffGate = evaluateDiffCleanliness(days, rows)
  if (diffGate.ok === false) {
    return diffGate
  }

  return { ok: true, unitId: unit.id }
}

export async function evaluateBackGate(input: IUnitGateInput): Promise<IUnitGateResult> {
  const qx = dbStoreQx(svc.postgres.writer)
  const unit = await findSyncUnitByChannelName(
    qx,
    input.integrationId,
    PLATFORM,
    input.channelName,
    input.syncName,
  )

  const gate = evaluateBackUnitGate(unit)
  if (gate.ok === false) {
    return gate
  }

  return { ok: true, unitId: unit.id }
}

export async function pauseNangoRepoSync(input: INangoSyncInput): Promise<void> {
  await initNangoCloudClient()
  await pauseNangoSync(NangoIntegration.GITHUB, input.connectionId, [input.nangoSync])
  svc.log.info({ event: SWITCH_EVENT, ...input }, 'nango sync paused')
}

export async function resumeNangoRepoSync(input: INangoSyncInput): Promise<void> {
  await initNangoCloudClient()
  await startNangoSync(NangoIntegration.GITHUB, input.connectionId, [input.nangoSync])
  svc.log.info({ event: SWITCH_EVENT, ...input }, 'nango sync resumed')
}

export async function setUnitEmitEnabled(input: ISetUnitEmitEnabledInput): Promise<void> {
  const qx = dbStoreQx(svc.postgres.writer)
  const updated = await setSyncUnitEmitEnabled(qx, input.unitId, input.emitEnabled)
  svc.log.info(
    { event: SWITCH_EVENT, ...input, alreadyInState: updated === 0 },
    'sync unit emit flag set',
  )
}
