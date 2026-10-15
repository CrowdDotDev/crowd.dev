import { QueryExecutor } from '../queryExecutor'

export interface IOctolensKeywordMapping {
  id: string
  integrationId: string
  segmentId: string
  keywordId: number
  keyword: string
}

// Reads return active mappings only; a deactivated mapping stays in the table for history.
export async function findOctolensKeywordMapping(
  qx: QueryExecutor,
  integrationId: string,
  keywordId: number,
): Promise<IOctolensKeywordMapping | null> {
  return qx.selectOneOrNone(
    `
      SELECT id, "integrationId", "segmentId", "keywordId", keyword
      FROM integration."octolensKeywordMappings"
      WHERE "integrationId" = $(integrationId)
        AND "keywordId" = $(keywordId)
        AND "deactivatedAt" IS NULL
    `,
    { integrationId, keywordId },
  )
}

export async function listOctolensKeywordMappings(
  qx: QueryExecutor,
  integrationId: string,
): Promise<IOctolensKeywordMapping[]> {
  return qx.select(
    `
      SELECT id, "integrationId", "segmentId", "keywordId", keyword
      FROM integration."octolensKeywordMappings"
      WHERE "integrationId" = $(integrationId) AND "deactivatedAt" IS NULL
      ORDER BY keyword
    `,
    { integrationId },
  )
}

export interface IUpsertOctolensKeywordMapping {
  integrationId: string
  segmentId: string
  keywordId: number
  keyword: string
}

// Inserts the mapping, or updates segmentId/keyword and reactivates an existing one.
// An unchanged active mapping is left untouched, so updatedAt only moves on a real change.
export async function upsertOctolensKeywordMapping(
  qx: QueryExecutor,
  data: IUpsertOctolensKeywordMapping,
): Promise<void> {
  await qx.result(
    `
      INSERT INTO integration."octolensKeywordMappings" ("integrationId", "segmentId", "keywordId", keyword)
      VALUES ($(integrationId), $(segmentId), $(keywordId), $(keyword))
      ON CONFLICT ("integrationId", "keywordId") DO UPDATE
      SET "segmentId" = EXCLUDED."segmentId",
          keyword = EXCLUDED.keyword,
          "deactivatedAt" = NULL,
          "updatedAt" = now()
      WHERE "octolensKeywordMappings"."segmentId" IS DISTINCT FROM EXCLUDED."segmentId"
         OR "octolensKeywordMappings".keyword IS DISTINCT FROM EXCLUDED.keyword
         OR "octolensKeywordMappings"."deactivatedAt" IS NOT NULL
    `,
    data,
  )
}

// Deactivates every active mapping of the integration whose keywordId isn't in seenKeywordIds.
// An empty set deactivates nothing: a run that saw no mappings must never wipe them all.
// Returns the number of mappings deactivated.
export async function deactivateOctolensKeywordMappingsNotSeen(
  qx: QueryExecutor,
  integrationId: string,
  seenKeywordIds: number[],
): Promise<number> {
  if (seenKeywordIds.length === 0) {
    return 0
  }

  return qx.result(
    `
      UPDATE integration."octolensKeywordMappings"
      SET "deactivatedAt" = now(), "updatedAt" = now()
      WHERE "integrationId" = $(integrationId)
        AND "deactivatedAt" IS NULL
        AND "keywordId" <> ALL($(seenKeywordIds)::int[])
    `,
    { integrationId, seenKeywordIds },
  )
}
