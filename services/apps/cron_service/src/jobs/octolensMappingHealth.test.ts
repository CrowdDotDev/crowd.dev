import { describe, expect, it, vi } from 'vitest'

import type {
  IDeactivatedOctolensKeywordMapping,
  IOctolensMappingDiscoveryHealth,
} from '@crowd/data-access-layer/src/octolens/health'
import { SlackPersona } from '@crowd/slack'

import {
  DEACTIVATIONS_CURSOR_KEY,
  IOctolensMappingHealthAlert,
  IOctolensMappingHealthDeps,
  STALE_ALERTED_KEY,
  groupIntoDiscoveryRuns,
  isDeactivationBurst,
  runOctolensMappingHealthCheck,
} from './octolensMappingHealth'

const CHECKED_AT = new Date('2026-10-15T12:30:00.000Z')
const UNTIL = '2026-10-15T12:25:00.000Z'
const RUN_AT = new Date('2026-10-15T12:00:00.000Z')

function health(
  overrides: Partial<IOctolensMappingDiscoveryHealth> = {},
): IOctolensMappingDiscoveryHealth {
  return {
    activeMappings: 20,
    integrations: 4,
    lastDiscoveredAt: RUN_AT,
    checkedAt: CHECKED_AT,
    ...overrides,
  }
}

function deactivation(
  keywordId: number,
  overrides: Partial<IDeactivatedOctolensKeywordMapping> = {},
): IDeactivatedOctolensKeywordMapping {
  return {
    integrationId: 'int-1',
    keywordId,
    keyword: `keyword-${keywordId}`,
    segmentId: 'seg-1',
    segmentName: 'Project One',
    segmentSlug: 'project-one',
    deactivatedAt: RUN_AT,
    integrationDeleted: false,
    ...overrides,
  }
}

function setup(options: {
  health: IOctolensMappingDiscoveryHealth
  deactivations?: IDeactivatedOctolensKeywordMapping[]
  store?: Record<string, string>
  sendSucceeds?: boolean
}) {
  const store = new Map(Object.entries(options.store ?? {}))
  const ttls = new Map<string, number | undefined>()
  const sent: IOctolensMappingHealthAlert[] = []
  const listDeactivatedBetween = vi.fn(async () => options.deactivations ?? [])
  const deps: IOctolensMappingHealthDeps = {
    getHealth: async () => options.health,
    listDeactivatedBetween,
    getKey: async (key) => store.get(key) ?? null,
    setKey: async (key, value, expireAfterSeconds) => {
      store.set(key, value)
      ttls.set(key, expireAfterSeconds)
    },
    sendAlert: async (alert) => {
      sent.push(alert)
      return options.sendSucceeds ?? true
    },
  }
  return { deps, store, ttls, sent, listDeactivatedBetween }
}

function alertText(alert: IOctolensMappingHealthAlert): string {
  return alert.sections.map((s) => `${s.title}\n${s.text}`).join('\n')
}

describe('runOctolensMappingHealthCheck', () => {
  it('stays quiet and keeps no state while there are no active mappings', async () => {
    const { deps, store, sent, listDeactivatedBetween } = setup({
      health: health({ activeMappings: 0, integrations: 0, lastDiscoveredAt: null }),
    })

    await runOctolensMappingHealthCheck(deps)

    expect(sent).toEqual([])
    expect(store.size).toBe(0)
    expect(listDeactivatedBetween).not.toHaveBeenCalled()
  })

  it('sends nothing when healthy and moves the cursor', async () => {
    const { deps, store, sent } = setup({ health: health() })

    await runOctolensMappingHealthCheck(deps)

    expect(sent).toEqual([])
    expect(store.get(DEACTIVATIONS_CURSOR_KEY)).toBe(UNTIL)
  })

  it('looks back 24h on the first run and continues from the cursor afterwards', async () => {
    const first = setup({ health: health() })
    await runOctolensMappingHealthCheck(first.deps)
    expect(first.listDeactivatedBetween).toHaveBeenCalledWith(
      new Date('2026-10-14T12:25:00.000Z'),
      new Date(UNTIL),
    )

    const next = setup({
      health: health(),
      store: { [DEACTIVATIONS_CURSOR_KEY]: '2026-10-15T11:25:00.000Z' },
    })
    await runOctolensMappingHealthCheck(next.deps)
    expect(next.listDeactivatedBetween).toHaveBeenCalledWith(
      new Date('2026-10-15T11:25:00.000Z'),
      new Date(UNTIL),
    )
  })

  it('does not query when the cursor is already at the window end', async () => {
    const { deps, listDeactivatedBetween } = setup({
      health: health(),
      store: { [DEACTIVATIONS_CURSOR_KEY]: UNTIL },
    })

    await runOctolensMappingHealthCheck(deps)

    expect(listDeactivatedBetween).not.toHaveBeenCalled()
  })

  it('alerts on staleness once per episode, then again after the reminder expires', async () => {
    const stale = health({ lastDiscoveredAt: new Date('2026-10-15T08:00:00.000Z') })
    const { deps, store, ttls, sent } = setup({ health: stale })

    await runOctolensMappingHealthCheck(deps)
    await runOctolensMappingHealthCheck(deps)

    expect(sent).toHaveLength(1)
    expect(sent[0].persona).toBe(SlackPersona.WARNING_PROPAGATOR)
    const text = alertText(sent[0])
    expect(text).toContain('Last successful run: 2026-10-15 08:00 UTC (4h ago)')
    expect(text).toContain('Active mappings: 20 across 4 projects')
    expect(text).toContain('CROWD_OCTOLENS_API_TOKEN')
    expect(store.get(STALE_ALERTED_KEY)).toBe('2026-10-15T08:00:00.000Z')
    expect(ttls.get(STALE_ALERTED_KEY)).toBe(24 * 60 * 60)

    store.delete(STALE_ALERTED_KEY)
    await runOctolensMappingHealthCheck(deps)

    expect(sent).toHaveLength(2)
  })

  it('alerts again when a new stale episode starts', async () => {
    const { deps, sent } = setup({
      health: health({ lastDiscoveredAt: new Date('2026-10-15T08:00:00.000Z') }),
      store: { [STALE_ALERTED_KEY]: '2026-10-14T08:00:00.000Z' },
    })

    await runOctolensMappingHealthCheck(deps)

    expect(sent).toHaveLength(1)
  })

  it('does not treat discovery within the stale threshold as stale', async () => {
    const { deps, sent } = setup({
      health: health({ lastDiscoveredAt: new Date('2026-10-15T09:30:00.000Z') }),
    })

    await runOctolensMappingHealthCheck(deps)

    expect(sent).toEqual([])
  })

  it('keeps alerting staleness while the Slack send fails', async () => {
    const { deps, store, sent } = setup({
      health: health({ lastDiscoveredAt: new Date('2026-10-15T08:00:00.000Z') }),
      sendSucceeds: false,
    })

    await runOctolensMappingHealthCheck(deps)
    await runOctolensMappingHealthCheck(deps)

    expect(sent).toHaveLength(2)
    expect(store.has(STALE_ALERTED_KEY)).toBe(false)
  })

  it('reports a burst in one run as a warning listing every keyword and project', async () => {
    const { deps, store, sent } = setup({
      health: health(),
      deactivations: [
        deactivation(1),
        deactivation(2),
        deactivation(3, {
          integrationId: 'int-2',
          segmentName: 'Project Two',
          segmentSlug: 'project-two',
          integrationDeleted: true,
        }),
      ],
    })

    await runOctolensMappingHealthCheck(deps)

    expect(sent).toHaveLength(1)
    expect(sent[0].persona).toBe(SlackPersona.WARNING_PROPAGATOR)
    expect(sent[0].title).toBe('Octolens keyword mappings deactivated in bulk')
    const text = alertText(sent[0])
    expect(text).toContain('Deactivated mappings (3, 20 still active)')
    expect(text).toContain('• ⚠️ 2026-10-15 12:00 UTC: 3 deactivated')
    expect(text).toContain(
      'keyword-1 (1) → Project One (project-one), deactivated 2026-10-15 12:00 UTC',
    )
    expect(text).toContain(
      'keyword-3 (3) → Project Two (project-two), deactivated 2026-10-15 12:00 UTC, project has no Octolens keywords left',
    )
    expect(text).toContain('queue a manual backfill')
    expect(text).toContain('Nothing is re-fetched automatically')
    expect(store.get(DEACTIVATIONS_CURSOR_KEY)).toBe(UNTIL)
  })

  it('reports deactivations spread over runs as info', async () => {
    const { deps, sent } = setup({
      health: health(),
      deactivations: [
        deactivation(1, { deactivatedAt: new Date('2026-10-15T10:00:00.000Z') }),
        deactivation(2, { deactivatedAt: new Date('2026-10-15T11:00:00.000Z') }),
        deactivation(3, { deactivatedAt: new Date('2026-10-15T12:00:00.000Z') }),
      ],
    })

    await runOctolensMappingHealthCheck(deps)

    expect(sent[0].persona).toBe(SlackPersona.INFO_NOTIFIER)
    expect(alertText(sent[0])).toContain('Discovery runs (3)')
    expect(alertText(sent[0])).toContain('Window: 2026-10-14 12:25 UTC → 2026-10-15 12:25 UTC')
  })

  it('retries from the first lookback when the first send fails without a cursor', async () => {
    const options = {
      health: health(),
      deactivations: [deactivation(1)],
      sendSucceeds: false,
    }
    const { deps, store, listDeactivatedBetween } = setup(options)

    await runOctolensMappingHealthCheck(deps)
    expect(store.get(DEACTIVATIONS_CURSOR_KEY)).toBe('2026-10-14T12:25:00.000Z')

    options.health = health({ checkedAt: new Date('2026-10-15T14:30:00.000Z') })
    options.sendSucceeds = true
    await runOctolensMappingHealthCheck(deps)

    expect(listDeactivatedBetween).toHaveBeenLastCalledWith(
      new Date('2026-10-14T12:25:00.000Z'),
      new Date('2026-10-15T14:25:00.000Z'),
    )
    expect(store.get(DEACTIVATIONS_CURSOR_KEY)).toBe('2026-10-15T14:25:00.000Z')
  })

  it('keeps the cursor when the deactivation alert fails so the next run retries', async () => {
    const cursor = '2026-10-15T11:25:00.000Z'
    const { deps, store, sent } = setup({
      health: health(),
      deactivations: [deactivation(1)],
      store: { [DEACTIVATIONS_CURSOR_KEY]: cursor },
      sendSucceeds: false,
    })

    const result = await runOctolensMappingHealthCheck(deps)

    expect(sent).toHaveLength(1)
    expect(result.sendFailures).toBe(1)
    expect(store.get(DEACTIVATIONS_CURSOR_KEY)).toBe(cursor)
  })

  it('caps listed mappings and runs but keeps the full counts', async () => {
    const { deps, sent } = setup({
      health: health(),
      deactivations: Array.from({ length: 30 }, (_, i) =>
        deactivation(i + 1, { deactivatedAt: new Date(RUN_AT.getTime() - i * 60 * 60 * 1000) }),
      ),
    })

    await runOctolensMappingHealthCheck(deps)

    const text = alertText(sent[0])
    expect(text).toContain('Deactivated mappings (30, 20 still active)')
    expect(text).toContain('Discovery runs (30)')
    expect(text).toContain('keyword-25 (25)')
    expect(text).not.toContain('keyword-26 (26)')
    expect(text).toContain('… and 5 more mappings')
    expect(text).toContain('… and 20 more runs')
  })

  it('truncates very long keyword and project names', async () => {
    const { deps, sent } = setup({
      health: health(),
      deactivations: [deactivation(1, { keyword: 'k'.repeat(500) })],
    })

    await runOctolensMappingHealthCheck(deps)

    expect(alertText(sent[0])).toContain(`${'k'.repeat(99)}…`)
    expect(alertText(sent[0])).not.toContain('k'.repeat(100))
  })
})

describe('isDeactivationBurst', () => {
  it('flags three or more deactivations regardless of size', () => {
    expect(isDeactivationBurst(3, 1000)).toBe(true)
  })

  it('flags a quarter or more of the mappings', () => {
    expect(isDeactivationBurst(1, 3)).toBe(true)
    expect(isDeactivationBurst(2, 6)).toBe(true)
    expect(isDeactivationBurst(2, 7)).toBe(false)
  })
})

describe('groupIntoDiscoveryRuns', () => {
  it('groups rows by their shared deactivation timestamp in time order', () => {
    const later = new Date('2026-10-15T11:00:00.000Z')
    const earlier = new Date('2026-10-15T10:00:00.000Z')

    const runs = groupIntoDiscoveryRuns(
      [
        deactivation(1, { deactivatedAt: later }),
        deactivation(2, { deactivatedAt: earlier }),
        deactivation(3, { deactivatedAt: later }),
      ],
      100,
    )

    expect(runs).toEqual([
      { at: earlier, deactivated: 1, burst: false },
      { at: later, deactivated: 2, burst: false },
    ])
  })
})
