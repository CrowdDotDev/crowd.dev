import { log, proxyActivities } from '@temporalio/workflow'

import type * as activities from '../activities/mirrorSweepActivities'
import type { IMirrorSweepInput, IMirrorSweepSummary } from '../mirrorSweep'
import { MIRROR_CHUNK_SIZE, chunk, mirrorRoom } from '../mirrorSweepLimits'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
  },
})

export async function mirrorSweep(input: IMirrorSweepInput): Promise<IMirrorSweepSummary> {
  const startedAt = Date.now()
  const inShadow = await activity.countShadowRepos()
  const summary: IMirrorSweepSummary = {
    batchSize: input.batchSize,
    shadowCap: input.shadowCap,
    inShadow,
    candidates: 0,
    attempted: 0,
    mirrored: 0,
    skipped: 0,
    unitsInserted: 0,
    chunksFailed: 0,
    durationMs: 0,
  }

  const room = mirrorRoom(input, inShadow)
  if (room > 0) {
    const { since, candidatesTotal, batch } = await activity.selectMirrorBatch(room)
    summary.candidates = candidatesTotal

    for (const repos of chunk(batch, MIRROR_CHUNK_SIZE)) {
      try {
        const result = await activity.mirrorRepos(repos, since)
        summary.attempted += repos.length
        summary.mirrored += result.mirrored
        summary.skipped += result.skipped
        summary.unitsInserted += result.unitsInserted
      } catch (err) {
        log.error('mirror sweep chunk failed', { err })
        summary.chunksFailed += 1
        break
      }
    }
  }

  summary.durationMs = Date.now() - startedAt
  await activity.logMirrorSweepSummary(summary)
  return summary
}
