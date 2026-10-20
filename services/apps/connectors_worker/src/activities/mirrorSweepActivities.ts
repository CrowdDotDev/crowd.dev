import { countShadowRepos as countShadowReposInDb } from '@crowd/data-access-layer/src/connectors'
import { listUnmirroredNangoRepos } from '@crowd/data-access-layer/src/integrations'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import { TinybirdClient } from '@crowd/database'
import { initNangoCloudClient } from '@crowd/nango'

import { readGithubChannelActivity } from '../githubChannelActivity'
import { svc } from '../main'
import { mirrorRepo } from '../mirrorRepo'
import {
  type IMirrorCandidate,
  type IMirrorSweepSummary,
  MIRROR_RESOLVE_CONCURRENCY,
  chunk,
  mirrorSince,
  orderMirrorCandidates,
} from '../mirrorSweep'

export interface IMirrorBatch {
  since: string
  candidatesTotal: number
  batch: IMirrorCandidate[]
}

export interface IMirrorReposResult {
  mirrored: number
  skipped: number
  unitsInserted: number
}

export async function countShadowRepos(): Promise<number> {
  return countShadowReposInDb(dbStoreQx(svc.postgres.writer))
}

export async function selectMirrorBatch(limit: number): Promise<IMirrorBatch> {
  const now = new Date()
  const repos = await listUnmirroredNangoRepos(dbStoreQx(svc.postgres.writer))
  const activityByChannel = await readGithubChannelActivity(new TinybirdClient(), now)
  const ordered = orderMirrorCandidates(repos, activityByChannel)
  return {
    since: mirrorSince(now),
    candidatesTotal: ordered.length,
    batch: ordered.slice(0, limit),
  }
}

export async function mirrorRepos(
  batch: IMirrorCandidate[],
  since: string,
): Promise<IMirrorReposResult> {
  await initNangoCloudClient()
  const qx = dbStoreQx(svc.postgres.writer)
  const result: IMirrorReposResult = { mirrored: 0, skipped: 0, unitsInserted: 0 }

  for (const group of chunk(batch, MIRROR_RESOLVE_CONCURRENCY)) {
    const outcomes = await Promise.all(group.map((candidate) => mirrorRepo(qx, candidate, since)))
    outcomes.forEach((outcome, i) => {
      if (outcome.outcome === 'mirrored') {
        result.mirrored++
        result.unitsInserted += outcome.unitsInserted
        return
      }
      const { integrationId, owner, repoName } = group[i]
      result.skipped++
      svc.log.warn(
        {
          event: 'mirror_repo_skipped',
          integrationId,
          owner,
          repoName,
          reason: outcome.reason,
          message: outcome.message,
        },
        'repo skipped by mirror sweep',
      )
    })
  }

  return result
}

export async function logMirrorSweepSummary(summary: IMirrorSweepSummary): Promise<void> {
  svc.log.info({ event: 'mirror_sweep_summary', ...summary }, 'mirror sweep summary')
}
