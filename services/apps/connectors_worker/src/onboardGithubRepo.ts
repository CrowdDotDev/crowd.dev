import { githubConnector } from '@crowd/connectors/src/connectors/github'
import { resolveRepo } from '@crowd/connectors/src/connectors/github/discover'
import { parseRepoChannel } from '@crowd/connectors/src/connectors/github/paging'
import type { Channel } from '@crowd/connectors/src/types'
import {
  hasActiveSyncUnitsForChannelElsewhere,
  hasSyncUnitsForChannel,
  upsertSyncUnits,
} from '@crowd/data-access-layer/src/connectors'
import type { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'

import { type LifecycleSkipReason, isRenamedRepo } from './githubLifecycle'
import { lifecycleSkipReasonFor, rateLimitResetAt } from './githubSkipReasons'

export type OnboardRepoResult =
  | { outcome: 'created'; unitsInserted: number }
  | { outcome: 'skipped'; reason: LifecycleSkipReason; message?: string; resetAt?: string }

function resolveSkip(err: unknown): OnboardRepoResult {
  const reason = lifecycleSkipReasonFor('resolve', err)
  const resetAt = reason === 'rate_limited' ? rateLimitResetAt(err) : null
  return {
    outcome: 'skipped',
    reason,
    ...(err instanceof Error ? { message: err.message } : {}),
    ...(resetAt ? { resetAt: resetAt.toISOString() } : {}),
  }
}

export async function onboardGithubRepo(
  qx: QueryExecutor,
  token: string,
  integrationId: string,
  key: string,
  initialDelaySeconds?: number,
  resolved?: Channel,
): Promise<OnboardRepoResult> {
  let channel: Channel
  if (resolved) {
    channel = resolved
  } else {
    const { owner, repo } = parseRepoChannel(key)
    try {
      channel = await resolveRepo(token, owner, repo)
    } catch (err) {
      return resolveSkip(err)
    }
  }

  if (isRenamedRepo(key, channel.channelName)) {
    return { outcome: 'skipped', reason: 'repo_renamed' }
  }
  if (await hasActiveSyncUnitsForChannelElsewhere(qx, integrationId, channel.channelId)) {
    return {
      outcome: 'skipped',
      reason: 'owned_by_other_integration',
      message: `units exist for ${channel.channelName} under another integration`,
    }
  }
  if (await hasSyncUnitsForChannel(qx, integrationId, channel.channelId)) {
    return {
      outcome: 'skipped',
      reason: 'already_present',
      message: `units exist for ${channel.channelName}`,
    }
  }

  const unitsInserted = await upsertSyncUnits(
    qx,
    githubConnector.syncs.map(({ name }) => ({
      integrationId,
      platform: githubConnector.platform,
      channelId: channel.channelId,
      channelName: channel.channelName,
      syncName: name,
      emitEnabled: true,
      ...(initialDelaySeconds === undefined ? {} : { initialDelaySeconds }),
    })),
  )
  if (unitsInserted < githubConnector.syncs.length) {
    return {
      outcome: 'skipped',
      reason: 'already_present',
      message: `inserted ${unitsInserted} of ${githubConnector.syncs.length}`,
    }
  }
  return { outcome: 'created', unitsInserted }
}
