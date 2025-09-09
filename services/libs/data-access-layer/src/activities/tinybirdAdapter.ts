import { IQueryActivitiesParameters } from './types'

const DEFAULT_PAGE_SIZE = 20
const ORDER_ALLOW: Set<string> = new Set([
  'timestamp_DESC',
  'timestamp_ASC',
  'createdAt_DESC',
  'createdAt_ASC',
])

/**
 * Pick the first valid orderBy from the array, or fallback to 'timestamp_DESC'
 */
function pickOrder(orderBy?: string[]): string {
  if (!orderBy || orderBy.length === 0) return 'timestamp_DESC'
  const first = (orderBy.find((o) => typeof o === 'string' && o.trim().length > 0) || '').trim()
  return ORDER_ALLOW.has(first) ? first : 'timestamp_DESC'
}

/**
 * Map JS boolean to Tinybird UInt8 param (true→1, false→0, undefined→skip)
 */
function booleanToTinybirdFlag(value?: boolean): 0 | 1 | undefined {
  if (value === true) return 1
  if (value === false) return 0
  return undefined
}

/**
 * Type-safe non-empty array guard
 */
function isNonEmptyArray<T>(x: unknown): x is T[] {
  return Array.isArray(x) && x.length > 0
}

/** Minimal shape for filters we care about (helps linting & narrowing) */
type FilterShape = {
  timestamp?: { gt?: string; lt?: string }
  platform?: { eq?: string }
  channel?: { in?: string[] }
  type?: { eq?: string; in?: string[] }
  onlyContributions?: boolean
  isContribution?: boolean
  conversationId?: { in?: string[] }
  sourceId?: { in?: string[] }
  member?: { isTeamMember?: boolean; isBot?: boolean }
}

/** Tinybird params are primitives only */
type TBParams = Record<string, string | number | boolean>

/**
 * Build query params for the Tinybird pipe from a legacy `arg`.
 * Arrays are JSON-stringified because the pipe uses Array(..., 'String').
 */
export function buildActivitiesParams(arg: IQueryActivitiesParameters): TBParams {
  const params: TBParams = {}

  // segments (array → JSON string)
  params.segments = JSON.stringify(arg.segmentIds.join(',') || [])

  // pagination
  const pageSize = arg.noLimit === true ? 0 : (arg.limit ?? DEFAULT_PAGE_SIZE)
  const offset = arg.offset ?? 0
  params.pageSize = pageSize
  params.page = pageSize > 0 ? Math.floor(offset / pageSize) : 0

  // order
  params.orderBy = pickOrder(arg.orderBy)

  // count
  if (arg.countOnly) params.countOnly = 1

  // filters (narrow to known shape to avoid `any`)
  const filter = (arg.filter ?? {}) as Partial<FilterShape>

  // time range
  if (filter.timestamp?.gt) params.startDate = filter.timestamp.gt
  if (filter.timestamp?.lt) params.endDate = filter.timestamp.lt

  // platform
  if (typeof filter.platform?.eq === 'string') params.platform = filter.platform.eq

  // repos / channel
  if (isNonEmptyArray<string>(filter.channel?.in)) {
    params.repos = JSON.stringify(filter.channel.in)
  }

  // activity types
  if (typeof filter.type?.eq === 'string') params.activity_type = filter.type.eq
  if (isNonEmptyArray<string>(filter.type?.in)) {
    params.activity_types = JSON.stringify(filter.type.in)
  }

  // contributions (pipe default is onlyContributions=1)
  const onlyContrib = booleanToTinybirdFlag(filter.onlyContributions)
  const isContrib = booleanToTinybirdFlag(filter.isContribution)
  // prefer explicit onlyContributions; fallback to isContribution for compatibility
  const contribFlag = onlyContrib ?? isContrib
  if (contribFlag !== undefined) {
    params.onlyContributions = contribFlag
  }

  // conversation/source
  if (isNonEmptyArray<string>(filter.conversationId?.in)) {
    params.conversationIds = JSON.stringify(filter.conversationId.in)
  }
  if (isNonEmptyArray<string>(filter.sourceId?.in)) {
    params.sourceIds = JSON.stringify(filter.sourceId.in)
  }

  // member flags
  const teamFlag = booleanToTinybirdFlag(filter.member?.isTeamMember)
  if (teamFlag !== undefined) {
    params.memberIsTeamMember = teamFlag
  }
  const botFlag = booleanToTinybirdFlag(filter.member?.isBot)
  if (botFlag !== undefined) {
    params.memberIsBot = botFlag
  }

  return params
}
