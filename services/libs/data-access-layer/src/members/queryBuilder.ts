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

  // If filter references mo.*, we must ensure member_orgs is joined in the outer query.
  const filterHasMo = filterString.includes('mo.')
  const needsMemberOrgs = includeMemberOrgs || filterHasMo

  // We use the optimized path when:
  // - aggregates are requested (msa available)
  // - sorting is by activityCount (or not specified → default)
  // NOTE: we DO NOT check for mo./me. here because we keep all filters OUTSIDE the CTE.
  const useActivityCountOptimized = withAggregates && (!sortField || sortField === 'activityCount')

  log.info(`buildQuery: useActivityCountOptimized=${useActivityCountOptimized}`)

  if (useActivityCountOptimized) {
    const ctes: string[] = []

    // Include member_orgs CTE only if we need it in the OUTER query (never inside top_members)
    if (needsMemberOrgs) {
      ctes.push(buildMemberOrgsCTE(true).trim())
    }

    // Include search CTE if present
    if (searchConfig.cte) {
      ctes.push(searchConfig.cte.trim())
    }

    // Join search to msa WITHOUT touching members (so index on msa can be used)
    const searchJoinForTopMembers = searchConfig.cte
      ? `\n        INNER JOIN member_search ms ON ms."memberId" = msa."memberId"`
      : ''

    // Oversample: fetch more rows than needed before applying outer filters,
    // then apply LIMIT/OFFSET on the final ordered result.
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

    // IMPORTANT:
    // - All filters on members/orgs/enrichments are applied OUTSIDE the CTE.
    // - Final ORDER BY keeps activityCount (already aligned with top_members).
    // - Final LIMIT/OFFSET ensure correct pagination after applying filters.
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

  // Fallback path: any other sort mode.
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

  const orderClause = getOrderClause(sortField, direction, withAggregates)

  return `
    ${baseCtes.length > 0 ? `WITH ${baseCtes.join(',\n')}` : ''}
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
