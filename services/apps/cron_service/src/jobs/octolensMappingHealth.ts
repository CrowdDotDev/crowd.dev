import type {
  IDeactivatedOctolensKeywordMapping,
  IOctolensMappingDiscoveryHealth,
} from '@crowd/data-access-layer/src/octolens/health'
import { SlackMessageSection, SlackPersona, escapeSlackText } from '@crowd/slack'

export const STALE_AFTER_HOURS = 3
export const STALE_REMINDER_HOURS = 24
export const BURST_MIN_DEACTIVATIONS = 3
export const BURST_MIN_SHARE = 0.25
export const CURSOR_SAFETY_MARGIN_MINUTES = 5
export const INITIAL_LOOKBACK_HOURS = 24
export const MAX_LISTED_KEYWORDS = 25
export const MAX_LISTED_RUNS = 10
const MAX_NAME_LENGTH = 100

export const DEACTIVATIONS_CURSOR_KEY = 'octolens-mapping-health:deactivations-reported-until'
export const STALE_ALERTED_KEY = 'octolens-mapping-health:stale-alerted'

const HOUR_MS = 60 * 60 * 1000
const MINUTE_MS = 60 * 1000

export interface IOctolensMappingHealthAlert {
  persona: SlackPersona
  title: string
  sections: SlackMessageSection[]
}

export interface IOctolensMappingHealthDeps {
  getHealth: () => Promise<IOctolensMappingDiscoveryHealth>
  listDeactivatedBetween: (
    since: Date,
    until: Date,
  ) => Promise<IDeactivatedOctolensKeywordMapping[]>
  getKey: (key: string) => Promise<string | null>
  setKey: (key: string, value: string, expireAfterSeconds?: number) => Promise<void>
  sendAlert: (alert: IOctolensMappingHealthAlert) => Promise<boolean>
}

export interface IOctolensMappingHealthResult {
  activeMappings: number
  staleAlerted: boolean
  deactivationsReported: number
  sendFailures: number
}

export interface IDiscoveryRun {
  at: Date
  deactivated: number
  burst: boolean
}

export function hoursSince(from: Date, now: Date): number {
  return (now.getTime() - from.getTime()) / HOUR_MS
}

export function isStale(health: IOctolensMappingDiscoveryHealth): boolean {
  return (
    health.lastDiscoveredAt !== null &&
    hoursSince(health.lastDiscoveredAt, health.checkedAt) > STALE_AFTER_HOURS
  )
}

export function isDeactivationBurst(deactivated: number, activeMappings: number): boolean {
  if (deactivated >= BURST_MIN_DEACTIVATIONS) {
    return true
  }
  const total = activeMappings + deactivated
  return total > 0 && deactivated / total >= BURST_MIN_SHARE
}

// One discovery run deactivates in one transaction, so its rows share one now() timestamp.
export function groupIntoDiscoveryRuns(
  deactivations: IDeactivatedOctolensKeywordMapping[],
  activeMappings: number,
): IDiscoveryRun[] {
  const counts = new Map<number, number>()
  for (const row of deactivations) {
    const at = row.deactivatedAt.getTime()
    counts.set(at, (counts.get(at) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([at, deactivated]) => ({
      at: new Date(at),
      deactivated,
      burst: isDeactivationBurst(deactivated, activeMappings),
    }))
}

export function deactivationWindow(
  checkedAt: Date,
  cursor: string | null,
): { since: Date; until: Date; fromCursor: boolean } {
  const until = new Date(checkedAt.getTime() - CURSOR_SAFETY_MARGIN_MINUTES * MINUTE_MS)
  const cursorDate = cursor ? new Date(cursor) : null
  if (cursorDate && !Number.isNaN(cursorDate.getTime())) {
    return { since: cursorDate, until, fromCursor: true }
  }
  return {
    since: new Date(until.getTime() - INITIAL_LOOKBACK_HOURS * HOUR_MS),
    until,
    fromCursor: false,
  }
}

function formatUtc(date: Date): string {
  return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`
}

function formatName(name: string): string {
  const short = name.length > MAX_NAME_LENGTH ? `${name.slice(0, MAX_NAME_LENGTH - 1)}…` : name
  return escapeSlackText(short)
}

export function buildStaleAlert(
  health: IOctolensMappingDiscoveryHealth,
): IOctolensMappingHealthAlert {
  const lastDiscoveredAt = health.lastDiscoveredAt as Date
  return {
    persona: SlackPersona.WARNING_PROPAGATOR,
    title: 'Octolens mapping discovery looks stale',
    sections: [
      {
        title: '',
        text: [
          `Keyword-to-project mapping discovery has not completed a run in over ${STALE_AFTER_HOURS} hours.`,
          `Last successful run: ${formatUtc(lastDiscoveredAt)} (${Math.floor(hoursSince(lastDiscoveredAt, health.checkedAt))}h ago)`,
          `Active mappings: ${health.activeMappings} across ${health.integrations} projects`,
          'Existing mappings keep routing mentions, but keywords added, remapped or removed in ' +
            'Octolens are not picked up until discovery succeeds again. Check the ' +
            '`connectors-octolens-discovery` schedule in connectors_worker and that ' +
            '`CROWD_OCTOLENS_API_TOKEN` is set.',
        ].join('\n'),
      },
    ],
  }
}

// Capped because @crowd/slack silently prunes oversized messages while still reporting
// success, which would move the cursor past deactivations nobody saw.
function capLines(lines: string[], max: number, noun: string): string[] {
  if (lines.length <= max) {
    return lines
  }
  return [...lines.slice(0, max), `… and ${lines.length - max} more ${noun}`]
}

function formatRun(run: IDiscoveryRun): string {
  return `• ${run.burst ? '⚠️ ' : ''}${formatUtc(run.at)}: ${run.deactivated} deactivated`
}

function formatDeactivation(row: IDeactivatedOctolensKeywordMapping): string {
  return (
    `• ${formatName(row.keyword)} (${row.keywordId}) → ` +
    `${formatName(row.segmentName)} (${formatName(row.segmentSlug)}), ` +
    `deactivated ${formatUtc(row.deactivatedAt)}` +
    (row.integrationDeleted ? ', project has no Octolens keywords left' : '')
  )
}

export function buildDeactivationAlert(
  deactivations: IDeactivatedOctolensKeywordMapping[],
  activeMappings: number,
  since: Date,
  until: Date,
): IOctolensMappingHealthAlert {
  const runs = groupIntoDiscoveryRuns(deactivations, activeMappings)
  const burst = runs.some((run) => run.burst)

  return {
    persona: burst ? SlackPersona.WARNING_PROPAGATOR : SlackPersona.INFO_NOTIFIER,
    title: burst
      ? 'Octolens keyword mappings deactivated in bulk'
      : 'Octolens keyword mappings deactivated',
    sections: [
      {
        title: '',
        text: [
          `Window: ${formatUtc(since)} → ${formatUtc(until)}`,
          'Discovery no longer saw these keywords mapped to a project, so their mentions stop ' +
            'reaching it. Nothing is re-fetched automatically: if a keyword gets mapped again, ' +
            'queue a manual backfill from its deactivation time to recover the mentions in between.',
        ].join('\n'),
      },
      {
        title: `Discovery runs (${runs.length})`,
        text: capLines(runs.map(formatRun), MAX_LISTED_RUNS, 'runs').join('\n'),
      },
      {
        title: `Deactivated mappings (${deactivations.length}, ${activeMappings} still active)`,
        text: capLines(deactivations.map(formatDeactivation), MAX_LISTED_KEYWORDS, 'mappings').join(
          '\n',
        ),
      },
    ],
  }
}

async function reportDeactivations(
  deps: IOctolensMappingHealthDeps,
  health: IOctolensMappingDiscoveryHealth,
  result: IOctolensMappingHealthResult,
): Promise<void> {
  const { since, until, fromCursor } = deactivationWindow(
    health.checkedAt,
    await deps.getKey(DEACTIVATIONS_CURSOR_KEY),
  )
  if (since >= until) {
    return
  }
  // Pin the initial lookback so a retry after a failed send does not slide the window forward.
  if (!fromCursor) {
    await deps.setKey(DEACTIVATIONS_CURSOR_KEY, since.toISOString())
  }

  const deactivations = await deps.listDeactivatedBetween(since, until)
  if (deactivations.length > 0) {
    const alert = buildDeactivationAlert(deactivations, health.activeMappings, since, until)
    if (!(await deps.sendAlert(alert))) {
      result.sendFailures++
      return
    }
    result.deactivationsReported = deactivations.length
  }

  await deps.setKey(DEACTIVATIONS_CURSOR_KEY, until.toISOString())
}

async function reportStaleness(
  deps: IOctolensMappingHealthDeps,
  health: IOctolensMappingDiscoveryHealth,
  result: IOctolensMappingHealthResult,
): Promise<void> {
  if (!isStale(health)) {
    return
  }
  const episode = (health.lastDiscoveredAt as Date).toISOString()
  if ((await deps.getKey(STALE_ALERTED_KEY)) === episode) {
    return
  }

  if (!(await deps.sendAlert(buildStaleAlert(health)))) {
    result.sendFailures++
    return
  }
  await deps.setKey(STALE_ALERTED_KEY, episode, STALE_REMINDER_HOURS * 60 * 60)
  result.staleAlerted = true
}

// No active mapping means discovery never completed a run (or the token was never set): a run
// that sees no mappings writes nothing, so it cannot empty a populated table.
export async function runOctolensMappingHealthCheck(
  deps: IOctolensMappingHealthDeps,
): Promise<IOctolensMappingHealthResult> {
  const health = await deps.getHealth()
  const result: IOctolensMappingHealthResult = {
    activeMappings: health.activeMappings,
    staleAlerted: false,
    deactivationsReported: 0,
    sendFailures: 0,
  }
  if (health.activeMappings === 0) {
    return result
  }

  await reportDeactivations(deps, health, result)
  await reportStaleness(deps, health, result)
  return result
}
