import { assertCredentialKind } from '../../../types'
import type { SyncContext, SyncOutcome } from '../../../types'
import type { OctolensDeps } from '../deps'
import { mapMentionToActivity, octolensActivitySchema, toIsoTimestamp } from '../mapper'
import type { MappedOctolensMention } from '../mapper'
import { fetchMentionsPage } from '../mentionsClient'
import type { OctolensMention } from '../mentionsClient'

// Paces a large backfill at the 5-minute cadence (~240 requests/hour at most), so it can't
// exhaust the shared 500/hour budget and park the regular poll behind a 429.
const MAX_BACKFILL_PAGES_PER_RUN = 20

interface KeywordBackfill {
  keywordId: number
  cursor: string | null
}

interface OctolensWatermark {
  startDate: string | null
  cursor: string | null
  // Running max timestamp for the poll cycle in progress, separate from startDate (which
  // must stay frozen all cycle) so a resumed cycle doesn't lose earlier pages' progress.
  pendingMaxTimestamp: string | null
  // Keywords whose mentions were skipped for lack of a mapping. startDate has already moved past
  // those mentions, so once a keyword gets mapped its whole history is re-fetched via `backfill`.
  unmappedKeywords: number[]
  backfill: KeywordBackfill[]
}

function readWatermark(raw: Record<string, unknown> | null): OctolensWatermark {
  return {
    startDate: typeof raw?.startDate === 'string' ? raw.startDate : null,
    cursor: typeof raw?.cursor === 'string' ? raw.cursor : null,
    pendingMaxTimestamp:
      typeof raw?.pendingMaxTimestamp === 'string' ? raw.pendingMaxTimestamp : null,
    unmappedKeywords: Array.isArray(raw?.unmappedKeywords)
      ? raw.unmappedKeywords.filter((id): id is number => Number.isInteger(id))
      : [],
    backfill: Array.isArray(raw?.backfill)
      ? raw.backfill
          .filter(
            (item): item is KeywordBackfill =>
              Number.isInteger(item?.keywordId) &&
              (item.cursor === null || typeof item.cursor === 'string'),
          )
          .map(({ keywordId, cursor }) => ({ keywordId, cursor }))
      : [],
  }
}

export async function runMentionPoll(ctx: SyncContext<OctolensDeps>): Promise<SyncOutcome> {
  const credential = await ctx.getCredential()
  assertCredentialKind(credential, 'octolens-token')
  const { token } = credential.data

  const watermark = readWatermark(ctx.watermark)
  const unmappedKeywords = new Set(watermark.unmappedKeywords)
  const backfill: KeywordBackfill[] = []
  for (const item of watermark.backfill) {
    if (await ctx.deps.resolveSegmentId(item.keywordId)) backfill.push(item)
    else unmappedKeywords.add(item.keywordId)
  }
  for (const keywordId of watermark.unmappedKeywords) {
    if (await ctx.deps.resolveSegmentId(keywordId)) {
      unmappedKeywords.delete(keywordId)
      if (!backfill.some((item) => item.keywordId === keywordId)) {
        backfill.push({ keywordId, cursor: null })
      }
    }
  }

  // Known limitation: Octolens has no "discovered at" field, so a historical mention it adds
  // behind our watermark for an already-mapped keyword is missed.
  // Passed on every page this run — undocumented whether Octolens's cursor implicitly
  // preserves the original filters, so don't rely on it.
  const startDate = watermark.startDate ?? undefined
  let cursor: string | undefined = watermark.cursor ?? undefined
  let maxTimestampSeen = watermark.pendingMaxTimestamp ?? watermark.startDate
  // Not read via ctx.http (its token pool is unseeded here, see Manifest), so
  // sync_run_summary's requestCount always reads 0 for octolens — logged separately below.
  let pagesFetched = 0

  const commit = (poll: Pick<OctolensWatermark, 'startDate' | 'cursor' | 'pendingMaxTimestamp'>) =>
    ctx.commitWatermark({
      ...poll,
      unmappedKeywords: [...unmappedKeywords],
      backfill: backfill.map((item) => ({ ...item })),
    })

  const emitMentions = async (
    mentions: OctolensMention[],
    onTimestamp?: (isoTimestamp: string) => void,
  ) => {
    const bySegment = new Map<string, Record<string, unknown>[]>()
    for (const mention of mentions) {
      let mapped: MappedOctolensMention | null
      // A malformed field must not crash the whole page, so wrap mapping in try/catch —
      // but update the watermark first so one bad mention type can't stall it forever.
      try {
        onTimestamp?.(toIsoTimestamp(mention.timestamp))
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
        unmappedKeywords.add(mapped.keywordId)
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
  }

  let polled = false
  while (ctx.hasRunBudget()) {
    const page = await fetchMentionsPage(token, { startDate, cursor })
    pagesFetched += 1

    await emitMentions(page.data, (isoTimestamp) => {
      if (!maxTimestampSeen || isoTimestamp > maxTimestampSeen) {
        maxTimestampSeen = isoTimestamp
      }
    })

    if (!page.nextCursor) {
      // Fully drained, so safe to advance regardless of Octolens's sort order. Inclusive
      // startDate re-fetches the boundary mention next run, harmlessly deduped downstream.
      await commit({ startDate: maxTimestampSeen, cursor: null, pendingMaxTimestamp: null })
      polled = true
      break
    }

    // Not drained: resume via cursor rather than advancing startDate, which (if newest-first)
    // could skip older, unseen pages forever if this run is cut short here.
    cursor = page.nextCursor
    await commit({
      startDate: watermark.startDate,
      cursor,
      pendingMaxTimestamp: maxTimestampSeen,
    })
  }

  if (!polled) {
    ctx.log.info({ pagesFetched }, 'octolens mention poll deferred: run budget exhausted')
    return { complete: false }
  }

  // Re-fetched mentions dedupe downstream by sourceId.
  const drained = { startDate: maxTimestampSeen, cursor: null, pendingMaxTimestamp: null }
  let backfillPages = 0
  while (backfill.length > 0 && backfillPages < MAX_BACKFILL_PAGES_PER_RUN && ctx.hasRunBudget()) {
    const item = backfill[0]
    const page = await fetchMentionsPage(token, {
      keywordIds: [item.keywordId],
      cursor: item.cursor ?? undefined,
    })
    pagesFetched += 1
    backfillPages += 1

    await emitMentions(page.data)

    if (page.nextCursor && page.nextCursor !== item.cursor) {
      item.cursor = page.nextCursor
    } else {
      if (page.nextCursor) {
        ctx.log.warn(
          { keywordId: item.keywordId },
          'octolens keyword backfill cursor did not advance',
        )
      }
      backfill.shift()
      ctx.log.info({ keywordId: item.keywordId }, 'octolens keyword backfill complete')
    }
    await commit(drained)
  }

  // Unfinished backfill resumes at the next regular run rather than a short defer, which is the pacing.
  ctx.log.info(
    { pagesFetched, backfillKeywords: backfill.map((item) => item.keywordId) },
    'octolens mention poll complete',
  )
  return { complete: true }
}
