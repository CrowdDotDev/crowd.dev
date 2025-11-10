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

  // Detect if filters reference extra aliases.
  const filterHasMo = filterString.includes('mo.')
  const filterHasMe = filterString.includes('me.')

  // If filter references mo.*, we must ensure member_orgs is joined.
  const needsMemberOrgs = includeMemberOrgs || filterHasMo

  // Optimized path is only safe if:
  // - withAggregates is true
  // - sort is by activityCount (or default)
  // - filter does NOT reference mo. or me. (those aliases do not exist in top_members)
  const useActivityCountOptimized =
    withAggregates && !filterHasMo && !filterHasMe && (!sortField || sortField === 'activityCount')

  log.info(`buildQuery: useActivityCountOptimized=${useActivityCountOptimized}`)
  if (useActivityCountOptimized) {
    const ctes: string[] = []

    // For optimized path:
    // - We MAY include member_orgs CTE only if includeMemberOrgs is true.
    // - But filterString is guaranteed not to reference mo/me here.
    if (includeMemberOrgs) {
      const memberOrgsCTE = buildMemberOrgsCTE(true)
      ctes.push(memberOrgsCTE.trim())
    }

    if (searchConfig.cte) {
      ctes.push(searchConfig.cte.trim())
    }

    const searchJoinInTopMembers = searchConfig.join
      ? `\n        ${searchConfig.join}` // INNER JOIN member_search ms ON ms."memberId" = m.id
      : ''

    ctes.push(
      `
      top_members AS (
        SELECT
          msa."memberId"
        FROM "memberSegmentsAgg" msa
        JOIN members m ON m.id = msa."memberId"
        ${searchJoinInTopMembers}
        WHERE
          msa."segmentId" = $(segmentId)
          AND (${filterString})
        ORDER BY
          msa."activityCount" ${direction} NULLS LAST
        LIMIT ${limit} OFFSET ${offset}
      )
    `.trim(),
    )

    const withClause = `WITH ${ctes.join(',\n')}`

    const memberOrgsJoin = includeMemberOrgs
      ? `LEFT JOIN member_orgs mo ON mo."memberId" = m.id`
      : ''

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
    `.trim()
  }

  // Fallback path: any case that is not safe/eligible for optimization.
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
