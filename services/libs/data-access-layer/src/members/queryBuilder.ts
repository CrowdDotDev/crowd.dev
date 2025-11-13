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
  const defaultOrder = withAggregates ? 'msa."activityCount" DESC' : 'm."joinedAt" DESC'

  if (!parsedField) return defaultOrder

  const fieldExpr = ORDER_FIELD_MAP[parsedField]

  if (!fieldExpr) return defaultOrder

  if (!withAggregates && fieldExpr.includes('msa.')) {
    return defaultOrder
  }

  return `${fieldExpr} ${direction}`
}

// TODO: rework
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
  const filterHasM = filterString.includes('m.') && !filterString.match(/\bm\.id\b/)
  const needsMemberOrgs = includeMemberOrgs || filterHasMo

  // If filters pin m.id to a single value or a small IN-list, skip top-N entirely.
  const { pinned, smallList } = detectPinnedMemberId(filterString)
  const useDirectIdPath = withAggregates && pinned && smallList

  // Default sort clause for fallback/outer queries
  const orderClause = getOrderClause(sortField, direction, withAggregates)

  log.info(`useDirectIdPath=${useDirectIdPath}`)
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

  // Only use activityCount optimization if:
  // 1. We have aggregates and are sorting by activityCount
  // 2. No filters on member attributes, enrichments, or organizations (only segment/search filters are safe)
  // 3. Only basic filters that don't reduce the result set significantly
  const hasUnsafeFilters = filterHasMe || filterHasM || filterHasMo
  const useActivityCountOptimized =
    withAggregates &&
    (!sortField || sortField === 'activityCount') &&
    !hasUnsafeFilters &&
    // Only allow if filterString is just basic segment/id filters or empty
    (!filterString || filterString.trim() === '' || filterString.match(/^\s*1\s*=\s*1\s*$/))

  log.info(
    `useActivityCountOptimized=${useActivityCountOptimized}, hasUnsafeFilters=${hasUnsafeFilters}`,
  )

  if (useActivityCountOptimized) {
    const ctes: string[] = []
    if (searchConfig.cte) ctes.push(searchConfig.cte.trim())

    const searchJoinForTopMembers = searchConfig.cte
      ? `\n        INNER JOIN member_search ms ON ms."memberId" = msa."memberId"`
      : ''

    // Fix pagination: fetch enough rows to handle the requested page correctly
    const totalNeeded = limit + offset

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
        LIMIT ${totalNeeded}
      )
    `.trim(),
    )

    const withClause = `WITH ${ctes.join(',\n')}`

    return `
      ${withClause}
      SELECT ${fields}
      FROM top_members tm
      JOIN members m
        ON m.id = tm."memberId"
      INNER JOIN "memberSegmentsAgg" msa
        ON msa."memberId" = m.id
       AND msa."segmentId" = $(segmentId)
      LEFT JOIN "memberEnrichments" me
        ON me."memberId" = m.id
      WHERE (${filterString})
      ORDER BY
        msa."activityCount" ${direction} NULLS LAST
      LIMIT ${limit}
      OFFSET ${offset}
    `.trim()
  }

  // Fallback path (other sorts / non-aggregate / filtered queries)
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
  const filterHasMe = filterString.includes('me.')
  const needsMemberOrgs = includeMemberOrgs || filterHasMo

  const ctes = [needsMemberOrgs ? buildMemberOrgsCTE(true) : '', searchConfig.cte].filter(Boolean)

  const joins = [
    withAggregates
      ? `INNER JOIN "memberSegmentsAgg" msa ON msa."memberId" = m.id AND msa."segmentId" = $(segmentId)`
      : '',
    needsMemberOrgs ? `LEFT JOIN member_orgs mo ON mo."memberId" = m.id` : '',
    filterHasMe ? `LEFT JOIN "memberEnrichments" me ON me."memberId" = m.id` : '',
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
