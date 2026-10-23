import { IAttributes } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

export interface ICrustdataMemberLocation {
  memberId: string
  location: string | null
  country: string | null
}

export async function fetchMemberAttributes(
  qx: QueryExecutor,
  memberId: string,
): Promise<IAttributes> {
  const result = await qx.select(
    `
      SELECT attributes
      FROM "members"
      WHERE "id" = $(memberId)
      LIMIT 1;
    `,
    {
      memberId,
    },
  )

  return result[0]?.attributes
}

// Returns every scanned cache row so callers can page by memberId. Location and country are
// only set when Crustdata is the member's sole source with a single verified profile.
export async function fetchCrustdataMemberLocations(
  qx: QueryExecutor,
  limit: number,
  afterMemberId?: string,
): Promise<ICrustdataMemberLocation[]> {
  return qx.select(
    `
      WITH batch AS (
        SELECT "memberId", data
        FROM "memberEnrichmentCache"
        WHERE source = 'crustdata'
          AND data IS NOT NULL
          ${afterMemberId ? `AND "memberId" > $(afterMemberId)` : ''}
        ORDER BY "memberId"
        LIMIT $(limit)
      ),
      verified_profiles AS (
        SELECT b."memberId", (array_agg(p))[1] -> 'basic_profile' -> 'location' AS location
        FROM batch b
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE WHEN jsonb_typeof(b.data) = 'array' THEN b.data ELSE '[]'::jsonb END
        ) p
        WHERE (p -> 'metadata' ->> 'isFromVerifiedSource')::boolean
        GROUP BY b."memberId"
        HAVING count(*) = 1
      )
      SELECT
        b."memberId",
        v.location ->> 'raw' AS location,
        v.location ->> 'country' AS country
      FROM batch b
      LEFT JOIN verified_profiles v
        ON v."memberId" = b."memberId"
        AND NOT EXISTS (
          SELECT 1
          FROM "memberEnrichmentCache" o
          WHERE o."memberId" = b."memberId"
            AND o.source <> 'crustdata'
            AND o.data IS NOT NULL
        )
      ORDER BY b."memberId"
    `,
    { limit, afterMemberId },
  )
}

export async function updateMemberAttributes(
  qx: QueryExecutor,
  memberId: string,
  attributes: IAttributes,
): Promise<void> {
  await qx.result(
    `
          UPDATE "members"
          SET
              attributes = $(attributes),
              "updatedAt" = NOW()
          WHERE "id" = $(memberId)
      `,
    {
      memberId,
      attributes,
    },
  )
}
