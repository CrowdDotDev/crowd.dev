import { assertCredentialKind } from '../../../types'
import type { SyncContext, SyncOutcome } from '../../../types'
import type { OctolensDeps } from '../deps'
import { mapMentionToActivity, octolensActivitySchema, toIsoTimestamp } from '../mapper'
import type { MappedOctolensMention } from '../mapper'
import { fetchMentionsPage } from '../mentionsClient'

interface OctolensWatermark {
  startDate: string | null
  cursor: string | null
  // Running max timestamp for the poll cycle in progress, separate from startDate (which
  // must stay frozen all cycle) so a resumed cycle doesn't lose earlier pages' progress.
  pendingMaxTimestamp: string | null
}

function readWatermark(raw: Record<string, unknown> | null): OctolensWatermark {
  return {
    startDate: typeof raw?.startDate === 'string' ? raw.startDate : null,
    cursor: typeof raw?.cursor === 'string' ? raw.cursor : null,
    pendingMaxTimestamp:
      typeof raw?.pendingMaxTimestamp === 'string' ? raw.pendingMaxTimestamp : null,
  }
}

export async function runMentionPoll(ctx: SyncContext<OctolensDeps>): Promise<SyncOutcome> {
  const credential = await ctx.getCredential()
  assertCredentialKind(credential, 'octolens-token')

  const watermark = readWatermark(ctx.watermark)
  // Known limitation, not fixed here: Octolens has no "discovered at" field, so a backfilled
  // historical mention older than our watermark is missed permanently — see rundown Step 6.
  // Passed on every page this run — undocumented whether Octolens's cursor implicitly
  // preserves the original filters, so don't rely on it.
  const startDate = watermark.startDate ?? undefined
  let cursor: string | undefined = watermark.cursor ?? undefined
  let maxTimestampSeen = watermark.pendingMaxTimestamp ?? watermark.startDate
  // Not read via ctx.http (its token pool is unseeded here, see Manifest), so
  // sync_run_summary's requestCount always reads 0 for octolens — logged separately below.
  let pagesFetched = 0

  while (ctx.hasRunBudget()) {
    const page = await fetchMentionsPage(credential.data.token, { startDate, cursor })
    pagesFetched += 1

    const bySegment = new Map<string, Record<string, unknown>[]>()
    for (const mention of page.data) {
      let mapped: MappedOctolensMention | null
      // A malformed field must not crash the whole page, so wrap mapping in try/catch —
      // but update the watermark first so one bad mention type can't stall it forever.
      try {
        const isoTimestamp = toIsoTimestamp(mention.timestamp)
        if (!maxTimestampSeen || isoTimestamp > maxTimestampSeen) {
          maxTimestampSeen = isoTimestamp
        }
        mapped = mapMentionToActivity(mention)
        // Catches a numeric title/sourceId etc that passes the mapper but would otherwise
        // crash createEmit's own schema parse, uncaught, outside this loop.
        if (mapped) octolensActivitySchema.parse(mapped.activity)
      } catch (err) {
        // Optional chaining: a null/non-object page.data entry must not also crash this
        // handler by dereferencing it here.
        ctx.log.warn(
          { sourceId: mention?.sourceId, errMsg: (err as Error).message },
          'skipping octolens mention: failed to process (malformed provider data)',
        )
        continue
      }

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

      // Not wrapped above: a transient DB failure here must propagate as a real run
      // failure to retry, not be swallowed as "malformed mention data."
      const segmentId = await ctx.deps.resolveSegmentId(mapped.keywordId)
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

    if (!page.nextCursor) {
      // Fully drained, so safe to advance regardless of Octolens's sort order. Inclusive
      // startDate re-fetches the boundary mention next run, harmlessly deduped downstream.
      await ctx.commitWatermark({
        startDate: maxTimestampSeen,
        cursor: null,
        pendingMaxTimestamp: null,
      })
      ctx.log.info({ pagesFetched }, 'octolens mention poll complete')
      return { complete: true }
    }

    // Not drained: resume via cursor rather than advancing startDate, which (if newest-first)
    // could skip older, unseen pages forever if this run is cut short here.
    cursor = page.nextCursor
    await ctx.commitWatermark({
      startDate: watermark.startDate,
      cursor,
      pendingMaxTimestamp: maxTimestampSeen,
    })
  }

  ctx.log.info({ pagesFetched }, 'octolens mention poll deferred: run budget exhausted')
  return { complete: false }
}
