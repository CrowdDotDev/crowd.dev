import { assertCredentialKind } from '../../../types'
import type { SyncContext, SyncOutcome } from '../../../types'
import { mapMentionToActivity, toIsoTimestamp } from '../mapper'
import { fetchMentionsPage } from '../mentionsClient'

interface OctolensWatermark {
  startDate: string | null
  cursor: string | null
}

function readWatermark(raw: Record<string, unknown> | null): OctolensWatermark {
  return {
    startDate: typeof raw?.startDate === 'string' ? raw.startDate : null,
    cursor: typeof raw?.cursor === 'string' ? raw.cursor : null,
  }
}

export async function runMentionPoll(ctx: SyncContext): Promise<SyncOutcome> {
  const credential = await ctx.getCredential()
  assertCredentialKind(credential, 'octolens-token')

  const watermark = readWatermark(ctx.watermark)
  // Known limitation, not fixed here: Octolens has no "discovered at" field, so a backfilled
  // historical mention older than our watermark is missed permanently — see rundown Step 6.
  // Passed on every page this run — undocumented whether Octolens's cursor implicitly
  // preserves the original filters, so don't rely on it.
  const startDate = watermark.startDate ?? undefined
  let cursor: string | undefined = watermark.cursor ?? undefined
  let maxTimestampSeen = watermark.startDate
  // Not read via ctx.http (its token pool is unseeded here, see Manifest), so
  // sync_run_summary's requestCount always reads 0 for octolens — logged separately below.
  let pagesFetched = 0

  while (ctx.hasRunBudget()) {
    const page = await fetchMentionsPage(credential.data.token, { startDate, cursor })
    pagesFetched += 1

    const bySegment = new Map<string, Record<string, unknown>[]>()
    for (const mention of page.data) {
      // One mention's malformed field (e.g. a provider contract change dropping `source`)
      // must not crash the whole page — skip and log just that mention instead.
      try {
        const isoTimestamp = toIsoTimestamp(mention.timestamp)
        if (!maxTimestampSeen || isoTimestamp > maxTimestampSeen) {
          maxTimestampSeen = isoTimestamp
        }

        const mapped = mapMentionToActivity(mention)
        if (!mapped) {
          ctx.log.info(
            { source: mention.source, keywordId: mention.keywordId },
            'skipping octolens mention: unsupported source or no author identity',
          )
          continue
        }

        if (mapped.keywordId === undefined) {
          ctx.log.info(
            { sourceId: mention.sourceId },
            'skipping octolens mention: no keywordId on this mention',
          )
          continue
        }

        const segmentId = await ctx.resolveSegmentId(mapped.keywordId)
        if (!segmentId) {
          ctx.log.info(
            { keywordId: mapped.keywordId },
            'skipping octolens mention: no keyword mapping for this integration',
          )
          continue
        }

        const group = bySegment.get(segmentId) ?? []
        group.push(mapped.activity)
        bySegment.set(segmentId, group)
      } catch (err) {
        ctx.log.warn(
          { sourceId: mention.sourceId, errMsg: (err as Error).message },
          'skipping octolens mention: failed to process (malformed provider data)',
        )
      }
    }

    for (const [segmentId, activities] of bySegment) {
      await ctx.emit(activities, { segmentId, integrationId: ctx.integrationId })
    }

    if (!page.nextCursor) {
      // Fully drained, so safe to advance regardless of Octolens's sort order. Inclusive
      // startDate re-fetches the boundary mention next run, harmlessly deduped downstream.
      await ctx.commitWatermark({ startDate: maxTimestampSeen, cursor: null })
      ctx.log.info({ pagesFetched }, 'octolens mention poll complete')
      return { complete: true }
    }

    // Not drained: resume via cursor rather than advancing startDate, which (if newest-first)
    // could skip older, unseen pages forever if this run is cut short here.
    cursor = page.nextCursor
    await ctx.commitWatermark({ startDate: watermark.startDate, cursor })
  }

  ctx.log.info({ pagesFetched }, 'octolens mention poll deferred: run budget exhausted')
  return { complete: false }
}
