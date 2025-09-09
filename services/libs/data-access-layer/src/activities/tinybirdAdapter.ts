import { IQueryActivitiesParameters } from "./types"

const DEFAULT_PAGE_SIZE = 20
const ORDER_ALLOW = new Set(['timestamp_DESC', 'timestamp_ASC', 'createdAt_DESC', 'createdAt_ASC'])

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
function booleanToTinybirdFlag(value?: boolean): number | undefined {
    if (value === true) return 1
    if (value === false) return 0
    return undefined
}

function isNonEmptyArray(x: any): x is any[] {
    return Array.isArray(x) && x.length > 0
}

/**
 * Build query params for the Tinybird pipe from a legacy `arg`.
 * Arrays are JSON-stringified because the pipe uses Array(..., 'String').
 */
export function buildActivitiesParams(arg: IQueryActivitiesParameters): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {}

    params.segments = JSON.stringify(arg.segmentIds || [])

    // pagination
    const pageSize = arg.noLimit === true ? 0 : (arg.limit ?? DEFAULT_PAGE_SIZE)
    const offset = arg.offset ?? 0
    params.pageSize = pageSize
    params.page = pageSize > 0 ? Math.floor(offset / pageSize) : 0

    // order
    params.orderBy = pickOrder(arg.orderBy)

    // count
    if (arg.countOnly) params.countOnly = 1

    const f = arg.filter || {}

    // time range (inclusive strings 'YYYY-MM-DD HH:MM:SS' recommended)
    if (f.timestamp?.gt) params.startDate = f.timestamp.gt
    if (f.timestamp?.lt) params.endDate = f.timestamp.lt

    // platform
    if (typeof f.platform?.eq === 'string') params.platform = f.platform.eq

    // repos / channel
    if (isNonEmptyArray(f.channel?.in)) params.repos = JSON.stringify(f.channel.in)

    // activity types
    if (typeof f.type?.eq === 'string') params.activity_type = f.type.eq
    if (isNonEmptyArray(f.type?.in)) params.activity_types = JSON.stringify(f.type.in)

    // contributions (default behavior in the pipe is onlyContributions=1)
    if (typeof f.onlyContributions === 'boolean') {
        params.onlyContributions = booleanToTinybirdFlag(f.onlyContributions)!
    } else if (typeof f.isContribution === 'boolean') {
        params.onlyContributions = booleanToTinybirdFlag(f.isContribution)!
    }

    // conversation/source
    if (isNonEmptyArray(f.conversationId?.in)) params.conversationIds = JSON.stringify(f.conversationId.in)
    if (isNonEmptyArray(f.sourceId?.in)) params.sourceIds = JSON.stringify(f.sourceId.in)

    // member flags
    if (typeof f.member?.isTeamMember === 'boolean') {
        params.memberIsTeamMember = booleanToTinybirdFlag(f.member.isTeamMember)!
    }
    if (typeof f.member?.isBot === 'boolean') {
        params.memberIsBot = booleanToTinybirdFlag(f.member.isBot)!
    }

    return params
}
