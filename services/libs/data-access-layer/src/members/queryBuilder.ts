import { getServiceLogger } from '@crowd/logging'
import { MemberIdentityType } from '@crowd/types'

const log = getServiceLogger()

type OrderDirection = 'ASC' | 'DESC'

interface SearchConfig {
  cte: string
  join: string
}

interface BuildQueryArgs {
  fields: string
  withAggregates: boolean
  includeMemberOrgs: boolean
  searchConfig: SearchConfig
  filterString: string
  orderBy?: string
  orderDirection?: OrderDirection
  limit?: number
  offset?: number
}

interface BuildCountQueryArgs {
  withAggregates: boolean
  searchConfig: SearchConfig
  filterString: string
  includeMemberOrgs?: boolean
}

const ORDER_FIELD_MAP: Record<string, string> = {
  activityCount: 'msa."activityCount"',
  score: 'm."score"',
  joinedAt: 'm."joinedAt"',
  displayName: 'm."displayName"',
}

export const buildSearchCTE = (
  search: string,
): { cte: string; join: string; params: Record<string, string> } => {
  if (!search?.trim()) {
    return { cte: '', join: '', params: {} }
  }

  const searchTerm = search.toLowerCase().trim()

  return {
    cte: `
      member_search AS (
        SELECT DISTINCT mi."memberId"
        FROM "memberIdentities" mi
        INNER JOIN members m ON m.id = mi."memberId"
        WHERE (
          (mi.verified = true AND mi.type = $(emailType) AND LOWER(mi."value") LIKE $(searchPattern))
          OR LOWER(m."displayName") LIKE $(searchPattern)
        )
      )
    `,
    join: `INNER JOIN member_search ms ON ms."memberId" = m.id`,
    params: {
      emailType: MemberIdentityType.EMAIL,
      searchPattern: `%${searchTerm}%`,
    },
  }
}

export const buildMemberOrgsCTE = (includeMemberOrgs: boolean): string => {
  if (!includeMemberOrgs) return ''

  return `
    member_orgs AS (
      SELECT
        "memberId",
        ARRAY_AGG("organizationId"::TEXT) AS "organizationId"
      FROM "memberOrganizations"
      WHERE "deletedAt" IS NULL
      GROUP BY "memberId"
    )
  `
}

const parseOrderBy = (
  orderBy: string | undefined,
  fallbackDirection: OrderDirection,
): { field?: string; direction: OrderDirection } => {
  if (!orderBy || !orderBy.trim()) {
    return { field: undefined, direction: fallbackDirection }
  }

  const [rawField, rawDir] = orderBy.trim().split('_')
  const field = rawField?.trim() || undefined

  const dir = (rawDir || '').toUpperCase()
  const direction: OrderDirection =
    dir === 'ASC' || dir === 'DESC' ? (dir as OrderDirection) : fallbackDirection

  return { field, direction }
}

const getOrderClause = (
  parsedField: string | undefined,
  direction: OrderDirection,
  withAggregates: boolean,
): string => {
  // Default sort:
  // - when aggregates are included → sort by activityCount (from msa)
  // - otherwise → sort by joinedAt (from members)
  const defaultOrder = withAggregates ? 'msa."activityCount" DESC' : 'm."joinedAt" DESC'

  // If no specific order field is provided, use the default one
  if (!parsedField) return defaultOrder

  const fieldExpr = ORDER_FIELD_MAP[parsedField]

  // If the requested field is not mapped, fall back to default order
  if (!fieldExpr) return defaultOrder

  // Safety check:
  // If the order field refers to msa.* but aggregates are not included,
  // fallback to the default safe order instead of generating invalid SQL.
  if (!withAggregates && fieldExpr.includes('msa.')) {
    return defaultOrder
  }

  // Return the valid ORDER BY clause
  return `${fieldExpr} ${direction}`
}

const detectPinnedMemberId = (filterString: string): { pinned: boolean; smallList: boolean } => {
  if (!filterString) return { pinned: false, smallList: false }

  // m.id = '...'
  const eqRe = /\bm\.id\s*=\s*(?:'[^']+'|\$\([^)]+\)|:[a-zA-Z_]\w*|\?)/i
  if (eqRe.test(filterString)) return { pinned: true, smallList: true }

  // m.id IN ( ... )  → estimate list size by counting commas (rough but effective)
  const inRe = /\bm\.id\s+IN\s*\(([^)]+)\)/i
  const m = inRe.exec(filterString)
  if (m && m[1]) {
    const items = m[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    // Consider "small" lists up to ~100 items; tune if needed.
    return { pinned: true, smallList: items.length <= 100 }
  }

  return { pinned: false, smallList: false }
}

export const buildQuery = ({
  fields,
  withAggregates,
  includeMemberOrgs,
  searchConfig,
  filterString,
  orderBy,
  orderDirection,
  limit = 20,
  offset = 0,
}: BuildQueryArgs): string => {
  const fallbackDir: OrderDirection = orderDirection || 'DESC'
  const { field: sortField, direction } = parseOrderBy(orderBy, fallbackDir)

  // Detect alias usage in filters (to decide joins/CTEs needed outside)
  const filterHasMo = filterString.includes('mo.')
  const filterHasMe = filterString.includes('me.')
  const needsMemberOrgs = includeMemberOrgs || filterHasMo

  // If filters pin m.id to a single value or a small IN-list, skip top-N entirely.
  const { pinned, smallList } = detectPinnedMemberId(filterString)
  const useDirectIdPath = withAggregates && pinned && smallList

  // Default sort clause for fallback/outer queries
  const orderClause = getOrderClause(sortField, direction, withAggregates)

  if (useDirectIdPath) {
    // Direct path: start from memberSegmentsAgg keyed by (memberId, segmentId)
    const ctes: string[] = []
    if (needsMemberOrgs) ctes.push(buildMemberOrgsCTE(true).trim())

    const withClause = ctes.length ? `WITH ${ctes.join(',\n')}` : ''

    const memberOrgsJoin = needsMemberOrgs ? `LEFT JOIN member_orgs mo ON mo."memberId" = m.id` : ''

    // NOTE:
    // - We do NOT include member_search here; an ID-pin makes it redundant.
    // - We keep the full filterString (it already contains the m.id predicate).
    // - This path leverages the UNIQUE (memberId, segmentId) index for O(1) lookups.
    return `
      ${withClause}
      SELECT ${fields}
      FROM "memberSegmentsAgg" msa
      JOIN members m
        ON m.id = msa."memberId"
      ${memberOrgsJoin}
      LEFT JOIN "memberEnrichments" me
        ON me."memberId" = m.id
      WHERE
        msa."segmentId" = $(segmentId)
        AND (${filterString})
      ORDER BY ${orderClause} NULLS LAST
      LIMIT ${limit}
      OFFSET ${offset}
    `.trim()
  }

  // Decide if we can use the activityCount-optimized path
  const useActivityCountOptimized =
    withAggregates && (!sortField || sortField === 'activityCount') && !filterHasMe
  // (we do allow mo.* now, but only outside the CTE; see below)

  if (useActivityCountOptimized) {
    const ctes: string[] = []

    // Include member_orgs CTE only for the OUTER query (never filter inside the CTE)
    if (needsMemberOrgs) ctes.push(buildMemberOrgsCTE(true).trim())

    // Include search CTE if present, but join it to msa inside top_members via memberId
    if (searchConfig.cte) ctes.push(searchConfig.cte.trim())

    const searchJoinForTopMembers = searchConfig.cte
      ? `\n        INNER JOIN member_search ms ON ms."memberId" = msa."memberId"`
      : ''

    // Oversample to keep page filled after outer filters; tune multiplier if needed
    const oversampleMultiplier = 5
    const prefetch = Math.max(limit * oversampleMultiplier + offset, limit + offset)

    ctes.push(
      `
      top_members AS (
        SELECT
          msa."memberId",
          msa."activityCount"
        FROM "memberSegmentsAgg" msa
        ${searchJoinForTopMembers}
        WHERE
          msa."segmentId" = $(segmentId)
        ORDER BY
          msa."activityCount" ${direction} NULLS LAST
        LIMIT ${prefetch}
      )
    `.trim(),
    )

    const withClause = `WITH ${ctes.join(',\n')}`
    const memberOrgsJoin = needsMemberOrgs ? `LEFT JOIN member_orgs mo ON mo."memberId" = m.id` : ''

    // Outer filters (including mo./me.) applied here; index handles the CTE ranking
    return `
      ${withClause}
      SELECT ${fields}
      FROM top_members tm
      JOIN members m
        ON m.id = tm."memberId"
      INNER JOIN "memberSegmentsAgg" msa
        ON msa."memberId" = m.id
       AND msa."segmentId" = $(segmentId)
      ${memberOrgsJoin}
      LEFT JOIN "memberEnrichments" me
        ON me."memberId" = m.id
      WHERE (${filterString})
      ORDER BY
        msa."activityCount" ${direction} NULLS LAST
      LIMIT ${limit}
      OFFSET ${offset}
    `.trim()
  }

  // Fallback path (other sorts / non-aggregate)
  const baseCtes = [needsMemberOrgs ? buildMemberOrgsCTE(true) : '', searchConfig.cte].filter(
    Boolean,
  )

  const joins = [
    withAggregates
      ? `INNER JOIN "memberSegmentsAgg" msa ON msa."memberId" = m.id AND msa."segmentId" = $(segmentId)`
      : '',
    needsMemberOrgs ? `LEFT JOIN member_orgs mo ON mo."memberId" = m.id` : '',
    `LEFT JOIN "memberEnrichments" me ON me."memberId" = m.id`,
    searchConfig.join,
  ].filter(Boolean)

  return `
    ${baseCtes.length ? `WITH ${baseCtes.join(',\n')}` : ''}
    SELECT ${fields}
    FROM members m
    ${joins.join('\n')}
    WHERE (${filterString})
    ORDER BY ${orderClause} NULLS LAST
    LIMIT ${limit}
    OFFSET ${offset}
  `.trim()
}

export const buildCountQuery = ({
  withAggregates,
  searchConfig,
  filterString,
  includeMemberOrgs = false,
}: BuildCountQueryArgs): string => {
  const filterHasMo = filterString.includes('mo.')
  const needsMemberOrgs = includeMemberOrgs || filterHasMo

  const ctes = [needsMemberOrgs ? buildMemberOrgsCTE(true) : '', searchConfig.cte].filter(Boolean)

  const joins = [
    withAggregates
      ? `INNER JOIN "memberSegmentsAgg" msa ON msa."memberId" = m.id AND msa."segmentId" = $(segmentId)`
      : '',
    needsMemberOrgs ? `LEFT JOIN member_orgs mo ON mo."memberId" = m.id` : '',
    searchConfig.join,
  ].filter(Boolean)

  return `
    ${ctes.length > 0 ? `WITH ${ctes.join(',\n')}` : ''}
    SELECT COUNT(DISTINCT m.id) AS count
    FROM members m
    ${joins.join('\n')}
    WHERE (${filterString})
  `.trim()
}
