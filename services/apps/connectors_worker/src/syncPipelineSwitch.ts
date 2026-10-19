import type { ISyncDiffDayCounts, ISyncUnit } from '@crowd/data-access-layer/src/connectors'
import { GITHUB_SYNC_MAPPINGS, getGithubSyncForConnectorSync } from '@crowd/nango'

export type SwitchDirection = 'connectors' | 'nango'
export type SwitchOutcome = 'switched' | 'refused' | 'unchanged'

export interface ISwitchSyncResult {
  syncName: string
  outcome: SwitchOutcome
  reason?: string
}

export interface ISwitchSyncTarget {
  syncName: string
  nangoSync: string | null
}

export interface IGateRefusal {
  ok: false
  outcome: Exclude<SwitchOutcome, 'switched'>
  reason: string
  unitId?: string
}

export type GateVerdict = { ok: true } | IGateRefusal

const MS_PER_DAY = 24 * 60 * 60 * 1000
const DIFF_LAG_DAYS = 2
export const CLEAN_DAYS_REQUIRED = 3
export const NANGO_CONSUMPTION_MAX_AGE_MS = 24 * 60 * 60 * 1000

export function resolveSwitchTargets(requested?: string[]): ISwitchSyncTarget[] {
  const syncNames = requested?.length ? requested : GITHUB_SYNC_MAPPINGS.map((m) => m.connectorSync)
  return syncNames.map((syncName) => ({
    syncName,
    nangoSync: getGithubSyncForConnectorSync(syncName)?.nangoSync ?? null,
  }))
}

export function recentDiffedDays(now: Date, count = CLEAN_DAYS_REQUIRED): string[] {
  const latest = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Array.from({ length: count }, (_, i) =>
    new Date(latest - (DIFF_LAG_DAYS + i) * MS_PER_DAY).toISOString().slice(0, 10),
  )
}

export function evaluateForwardUnitGate(unit: ISyncUnit | null): GateVerdict {
  if (!unit) {
    return { ok: false, outcome: 'refused', reason: 'no sync unit mirrored for this sync' }
  }
  if (unit.status !== 'active' && unit.status !== 'paused') {
    return {
      ok: false,
      outcome: 'refused',
      reason: `unit status is '${unit.status}' (expected active or paused)`,
    }
  }
  const phase = unit.watermark?.phase
  if (phase !== 'incremental') {
    return {
      ok: false,
      outcome: 'refused',
      reason: `unit phase is '${phase}' (expected incremental)`,
    }
  }
  if (unit.emitEnabled) {
    return {
      ok: false,
      outcome: 'unchanged',
      reason: 'already emitting from the connectors',
      unitId: unit.id,
    }
  }
  return { ok: true }
}

export function evaluateNangoConsumption(lastCheckedAt: string | null, now: Date): GateVerdict {
  if (!lastCheckedAt) {
    return {
      ok: false,
      outcome: 'refused',
      reason: 'nango records never consumed for this connection',
    }
  }
  if (now.getTime() - new Date(lastCheckedAt).getTime() > NANGO_CONSUMPTION_MAX_AGE_MS) {
    return {
      ok: false,
      outcome: 'refused',
      reason: `nango records last consumed at ${lastCheckedAt}, more than 24h ago`,
    }
  }
  return { ok: true }
}

export function evaluateDiffCleanliness(days: string[], rows: ISyncDiffDayCounts[]): GateVerdict {
  const byDay = new Map(rows.map((row) => [row.day, row]))
  for (const day of days) {
    const row = byDay.get(day)
    if (!row) {
      return { ok: false, outcome: 'refused', reason: `no diff summary for ${day}` }
    }
    if (row.missingInShadowCount > 0 || row.unsupportedSyncCount > 0) {
      return {
        ok: false,
        outcome: 'refused',
        reason: `diff for ${day} has missingInShadow=${row.missingInShadowCount} unsupportedSync=${row.unsupportedSyncCount}`,
      }
    }
  }
  return { ok: true }
}

export function evaluateBackUnitGate(unit: ISyncUnit | null): GateVerdict {
  if (!unit) {
    return { ok: false, outcome: 'refused', reason: 'no sync unit mirrored for this sync' }
  }
  if (!unit.emitEnabled) {
    return {
      ok: false,
      outcome: 'unchanged',
      reason: 'already syncing through nango',
      unitId: unit.id,
    }
  }
  return { ok: true }
}
