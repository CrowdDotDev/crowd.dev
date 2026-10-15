import { QueryExecutor } from '../queryExecutor'

export interface IOctolensKeywordMapping {
  id: string
  integrationId: string
  segmentId: string
  keywordId: number
  keyword: string
}

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

// lastSeenAt moves on every call so gaps in discovery show up; updatedAt only on a real change.
export async function upsertOctolensKeywordMapping(
  qx: QueryExecutor,
  data: IUpsertOctolensKeywordMapping,
): Promise<void> {
  await qx.result(
    `
      INSERT INTO integration."octolensKeywordMappings" AS m
        ("integrationId", "segmentId", "keywordId", keyword, "lastSeenAt")
      VALUES ($(integrationId), $(segmentId), $(keywordId), $(keyword), now())
      ON CONFLICT ("integrationId", "keywordId") DO UPDATE
      SET "segmentId" = EXCLUDED."segmentId",
          keyword = EXCLUDED.keyword,
          "deactivatedAt" = NULL,
          "lastSeenAt" = now(),
          "updatedAt" = CASE
            WHEN m."segmentId" IS DISTINCT FROM EXCLUDED."segmentId"
              OR m.keyword IS DISTINCT FROM EXCLUDED.keyword
              OR m."deactivatedAt" IS NOT NULL
            THEN now()
            ELSE m."updatedAt"
          END
    `,
    data,
  )
}

// An empty set deactivates nothing: a run that saw no mappings must never wipe them all.
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
