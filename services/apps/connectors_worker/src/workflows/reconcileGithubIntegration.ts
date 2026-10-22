import { log, proxyActivities } from '@temporalio/workflow'

import type { Channel } from '@crowd/connectors/src/types'

import type * as activities from '../activities/githubLifecycleActivities'
import type { IGithubLifecyclePlan } from '../activities/githubLifecycleActivities'
import {
  type IGithubLifecycleSummary,
  type ILifecycleSkip,
  githubRepoKey,
} from '../githubLifecycle'
import { chunk } from '../mirrorSweepLimits'
import { pollUntilDrained } from './drain'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
  },
})

const longActivity = proxyActivities<
  Pick<typeof activities, 'discoverFullSyncRepos' | 'onboardGithubRepos'>
>({
  startToCloseTimeout: '90 minutes',
  heartbeatTimeout: '5 minutes',
  retry: {
    maximumAttempts: 1,
  },
})

const ONBOARD_BATCH_SIZE = 500

export interface IReconcileGithubIntegrationInput {
  integrationId: string
}

export type ReconcileGithubIntegrationResult = IGithubLifecycleSummary & {
  outcome?: 'not_found' | 'not_github_nango'
}

export async function reconcileGithubIntegration({
  integrationId,
}: IReconcileGithubIntegrationInput): Promise<ReconcileGithubIntegrationResult> {
  const startedAt = Date.now()
  const discovery = await longActivity.discoverFullSyncRepos({ integrationId })
  const plan = await activity.planGithubLifecycle({ integrationId })
  const summary: IGithubLifecycleSummary = {
    integrationId,
    deleted: plan.deleted,
    desired: plan.desired,
    discovered: discovery.discovered.length,
    created: 0,
    unitsInserted: 0,
    deletedUnits: 0,
    undrainedChannels: 0,
    deletesSuppressed: plan.deletesSuppressed,
    failed: false,
    skipped: 0,
    durationMs: 0,
  }

  const outcome = ineligibleOutcome(plan)
  if (outcome) {
    log.warn('github lifecycle reconcile skipped', { integrationId, outcome })
    return { ...summary, durationMs: Date.now() - startedAt, outcome }
  }

  try {
    await applyPlan(integrationId, plan, discovery.skipped, discovery.discovered, summary)
  } catch (err) {
    summary.failed = true
    summary.durationMs = Date.now() - startedAt
    await activity.logGithubLifecycleSummary(summary)
    throw err
  }

  summary.durationMs = Date.now() - startedAt
  await activity.logGithubLifecycleSummary(summary)
  return summary
}

async function applyPlan(
  integrationId: string,
  plan: IGithubLifecyclePlan,
  discoverySkips: ILifecycleSkip[],
  discovered: Channel[],
  summary: IGithubLifecycleSummary,
): Promise<void> {
  const skipped = [...discoverySkips, ...planSkips(plan)]
  if (skipped.length > 0) {
    await activity.logLifecycleSkips({ integrationId, skipped })
  }
  summary.skipped = skipped.length

  if (plan.deleted || plan.toDeleteKeys.length > 0) {
    await deletePhase(integrationId, plan, summary)
  }

  if (!plan.deleted && plan.toCreate.length > 0) {
    await createPhase(integrationId, plan.toCreate, resolvedByKey(discovered), summary)
  }
}

function ineligibleOutcome(
  plan: IGithubLifecyclePlan,
): ReconcileGithubIntegrationResult['outcome'] {
  if (!plan.found) {
    return 'not_found'
  }
  return plan.githubNango ? undefined : 'not_github_nango'
}

function planSkips(plan: IGithubLifecyclePlan): ILifecycleSkip[] {
  return [
    ...plan.invalidUrls.map((url) => ({ url, reason: 'invalid_url' as const })),
    ...plan.ownedElsewhere.map((url) => ({ url, reason: 'owned_by_other_integration' as const })),
  ]
}

function resolvedByKey(discovered: Channel[]): Record<string, Channel> {
  const resolved: Record<string, Channel> = {}
  for (const channel of discovered) {
    const key = githubRepoKey(channel.channelName)
    if (key !== null) {
      resolved[key] = channel
    }
  }
  return resolved
}

function resolvedFor(keys: string[], resolved: Record<string, Channel>): Record<string, Channel> {
  return Object.fromEntries(
    keys.filter((key) => key in resolved).map((key) => [key, resolved[key]]),
  )
}

async function deletePhase(
  integrationId: string,
  plan: IGithubLifecyclePlan,
  summary: IGithubLifecycleSummary,
): Promise<void> {
  if (plan.deleted) {
    await activity.decommissionAllUnits({ integrationId })
  } else {
    await activity.decommissionChannels({ integrationId, channelKeys: plan.toDeleteKeys })
  }
  await pollUntilDrained(async () => (await activity.countUndrainedUnits({ integrationId })) === 0)
  summary.deletedUnits = await activity.deleteDrainedUnits({ integrationId })

  const undrained = await activity.listUndeletedChannels({ integrationId })
  if (undrained.length > 0) {
    await activity.logUndrainedChannels({ integrationId, channelKeys: undrained })
  }
  summary.undrainedChannels = undrained.length
}

async function createPhase(
  integrationId: string,
  toCreate: string[],
  resolved: Record<string, Channel>,
  summary: IGithubLifecycleSummary,
): Promise<void> {
  for (const keys of chunk(toCreate, ONBOARD_BATCH_SIZE)) {
    const onboarded = await longActivity.onboardGithubRepos({
      integrationId,
      keys,
      resolved: resolvedFor(keys, resolved),
    })
    summary.created += onboarded.created
    summary.unitsInserted += onboarded.unitsInserted
    summary.skipped += onboarded.skipped
  }
}
