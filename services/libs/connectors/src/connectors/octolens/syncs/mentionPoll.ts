import { assertCredentialKind } from '../../../types'
import type { SyncContext, SyncOutcome } from '../../../types'
import { mapMentionToActivity, toIsoTimestamp } from '../mapper'
import { fetchMentionsPage } from '../mentionsClient'

interface OctolensWatermark {
  startDate: string | null
}

function readWatermark(raw: Record<string, unknown> | null): OctolensWatermark {
  return { startDate: typeof raw?.startDate === 'string' ? raw.startDate : null }
}

export async function runMentionPoll(ctx: SyncContext): Promise<SyncOutcome> {
  const credential = await ctx.getCredential()
  assertCredentialKind(credential, 'octolens-token')

  const watermark = readWatermark(ctx.watermark)
  // Passed on every page this run, cursor included — undocumented whether Octolens's cursor
  // implicitly preserves the original filters, so don't rely on it.
  const startDate = watermark.startDate ?? undefined
  let cursor: string | undefined
  let maxTimestampSeen = watermark.startDate
  // Not read via ctx.http (its token pool is unseeded here, see Manifest), so
  // sync_run_summary's requestCount always reads 0 for octolens — logged separately below.
  let pagesFetched = 0

  while (ctx.hasRunBudget()) {
    const page = await fetchMentionsPage(credential.data.token, { startDate, cursor })
    pagesFetched += 1

    const bySegment = new Map<string, Record<string, unknown>[]>()
    for (const mention of page.data) {
      let isoTimestamp: string
      try {
        isoTimestamp = toIsoTimestamp(mention.timestamp)
      } catch (err) {
        ctx.log.warn(
          {
            sourceId: mention.sourceId,
            timestamp: mention.timestamp,
            errMsg: (err as Error).message,
          },
          'skipping octolens mention: unparseable timestamp',
        )
        continue
      }
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
    }

    for (const [segmentId, activities] of bySegment) {
      await ctx.emit(activities, { segmentId, integrationId: ctx.integrationId })
    }

    // startDate is inclusive ("from this date onwards"), so the boundary mention(s) are
    // refetched next run — harmless, queryActivityRelations dedupes by sourceId+timestamp.
    if (maxTimestampSeen) {
      await ctx.commitWatermark({ startDate: maxTimestampSeen })
    }

    if (!page.nextCursor) {
      ctx.log.info({ pagesFetched }, 'octolens mention poll complete')
      return { complete: true }
    }
    cursor = page.nextCursor
  }

  ctx.log.info({ pagesFetched }, 'octolens mention poll deferred: run budget exhausted')
  return { complete: false }
}
