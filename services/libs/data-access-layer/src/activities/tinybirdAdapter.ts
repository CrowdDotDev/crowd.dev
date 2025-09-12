import { IQueryActivitiesParameters } from './types'

const DEFAULT_PAGE_SIZE = 20
const ORDER_ALLOW: Set<string> = new Set([
  'timestamp_DESC',
  'timestamp_ASC',
  'createdAt_DESC',
  'createdAt_ASC',
])

type TBParams = Record<string, string | number | boolean>

const pickOrder = (orderBy?: string[]) => {
  if (!orderBy || orderBy.length === 0) return 'timestamp_DESC'
  const first = (orderBy.find((o) => typeof o === 'string' && o.trim()) || '').trim()
  return ORDER_ALLOW.has(first) ? first : 'timestamp_DESC'
}
const normArr = (x?: string | string[]) => {
  if (typeof x === 'string') return x.trim() ? [x.trim()] : undefined
  if (Array.isArray(x)) {
    const v = Array.from(new Set(x.map((s) => String(s).trim()).filter(Boolean)))
    return v.length ? v : undefined
  }
  return undefined
}
const pushCsv = (p: TBParams, key: string, v?: string[] | string) => {
  const arr = typeof v === 'string' ? normArr(v) : normArr(v)
  if (arr && arr.length) p[key] = arr.join(',')
}

/** AND-within, OR-across groups */
type GroupFilter = Partial<{
  memberIds: string[] | string
  memberIds_exclude: string[] | string
  activityTypes: string[] | string
  activityTypes_exclude: string[] | string
  organizationIds: string[] | string
  organizationIds_exclude: string[] | string
  platforms: string[] | string
  platforms_exclude: string[] | string
  channels: string[] | string
  channels_exclude: string[] | string
  ids: string[] | string
  ids_exclude: string[] | string
}>

type ExtendedArgs = IQueryActivitiesParameters & {
  searchTerm?: string
  groups?: GroupFilter[]
  filter?: any
}

type LeafField =
  | 'platform'
  | 'channel'
  | 'type'
  | 'organizationId'
  | 'memberId'
  | 'id'
  | 'title'
  | 'body'
  | 'timestamp'

function mergeGroup(a: GroupFilter, b: GroupFilter): GroupFilter {
  const out: GroupFilter = { ...a }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof GroupFilter>
  keys.forEach((k) => {
    const na = normArr((a as any)[k])
    const nb = normArr((b as any)[k])
    if (na && nb) (out as any)[k] = Array.from(new Set([...na, ...nb]))
    else (out as any)[k] = (nb ?? na) as any
  })
  return out
}

/** If ALL branches are include-only on the SAME field, compress them into one group */
function getSingleIncludeKey(g: GroupFilter): keyof GroupFilter | null {
  const includeKeys: (keyof GroupFilter)[] = [
    'memberIds',
    'activityTypes',
    'organizationIds',
    'platforms',
    'channels',
    'ids',
  ]
  const excludeKeys: (keyof GroupFilter)[] = [
    'memberIds_exclude',
    'activityTypes_exclude',
    'organizationIds_exclude',
    'platforms_exclude',
    'channels_exclude',
    'ids_exclude',
  ]
  for (const k of excludeKeys) if (normArr((g as any)[k])) return null
  const present: (keyof GroupFilter)[] = []
  for (const k of includeKeys) if (normArr((g as any)[k])) present.push(k)
  return present.length === 1 ? present[0] : null
}
function compressHomogeneousOrBranches(branches: GroupFilter[]): GroupFilter[] {
  const nonEmpty = branches.filter((g) => Object.keys(g).length > 0)
  if (nonEmpty.length <= 1) return nonEmpty
  const firstKey = getSingleIncludeKey(nonEmpty[0])
  if (!firstKey) return nonEmpty
  for (let i = 1; i < nonEmpty.length; i++) {
    if (getSingleIncludeKey(nonEmpty[i]) !== firstKey) return nonEmpty
  }
  const merged: GroupFilter = {}
  const allVals = nonEmpty.flatMap((g) => normArr((g as any)[firstKey]) || [])
  ;(merged as any)[firstKey] = Array.from(new Set(allVals))
  return [merged]
}

function leafToDelta(
  field: LeafField,
  pred: any,
  neg: boolean,
  inOr: boolean,
): GroupFilter | { startDate?: string; endDate?: string; searchTerm?: string; _ignored?: true } {
  if (field === 'timestamp') {
    if (inOr) {
      console.warn('[buildActivitiesParams] Ignoring timestamp inside OR (not representable).')
      return { _ignored: true }
    }
    if (neg) {
      console.warn('[buildActivitiesParams] Ignoring negated timestamp predicate.')
      return { _ignored: true }
    }
    const out: { startDate?: string; endDate?: string } = {}
    if (pred.gte || pred.gt) out.startDate = String(pred.gte ?? pred.gt)
    if (pred.lte || pred.lt) out.endDate = String(pred.lte ?? pred.lt)
    return out
  }

  if (pred && typeof pred === 'object' && typeof pred.textContains === 'string') {
    const val = pred.textContains.trim()
    if (!val) return {}
    if (neg) {
      console.warn('[buildActivitiesParams] Ignoring negated textContains for', field)
      return { _ignored: true }
    }
    return { searchTerm: val }
  }

  const keyMap: Record<
    Exclude<LeafField, 'timestamp' | 'title' | 'body'>,
    { inc: keyof GroupFilter; exc: keyof GroupFilter }
  > = {
    platform: { inc: 'platforms', exc: 'platforms_exclude' } as any,
    channel: { inc: 'channels', exc: 'channels_exclude' } as any,
    type: { inc: 'activityTypes', exc: 'activityTypes_exclude' } as any,
    organizationId: { inc: 'organizationIds', exc: 'organizationIds_exclude' } as any,
    memberId: { inc: 'memberIds', exc: 'memberIds_exclude' } as any,
    id: { inc: 'ids', exc: 'ids_exclude' } as any,
  }
  const m = (keyMap as any)[field]
  if (!m) return {}

  const values =
    normArr(pred?.in) ??
    normArr(pred?.eq) ??
    (pred != null && typeof pred !== 'object' ? normArr(String(pred)) : undefined)

  if (!values || values.length === 0) return {}
  return neg ? ({ [m.exc]: values } as any) : ({ [m.inc]: values } as any)
}

function parseLogicalFilter(filter: any): {
  groups: GroupFilter[]
  startDate?: string
  endDate?: string
  searchTerm?: string
} {
  if (!filter || typeof filter !== 'object') return { groups: [] }

  let skeleton: GroupFilter = {}
  let startDate: string | undefined
  let endDate: string | undefined
  let searchTerm: string | undefined
  const orGroups: GroupFilter[] = []

  const absorbSearch = (val?: string) => {
    if (!val) return
    if (!searchTerm) searchTerm = val
    else if (val !== searchTerm)
      console.warn(
        `[buildActivitiesParams] Multiple textContains ("${searchTerm}" vs "${val}"). Using the first.`,
      )
  }

  handleNode(filter, { neg: false, inOr: false, intoGroup: undefined })

  const groups =
    orGroups.length > 0
      ? orGroups.map((g) => mergeGroup(skeleton, g))
      : Object.keys(skeleton).length
        ? [skeleton]
        : []

  return { groups, startDate, endDate, searchTerm }

  function handleNode(node: any, ctx: { neg: boolean; inOr: boolean; intoGroup?: GroupFilter }) {
    if (!node || typeof node !== 'object') return

    // NOT: standard form is a node with only 'not'
    if (node.not) {
      handleNode(node.not, { neg: !ctx.neg, inOr: ctx.inOr, intoGroup: ctx.intoGroup })
      // continue processing other keys too if they co-exist (defensive)
    }

    let compositeHandled = false

    // AND: process but do NOT early-return; a node might have both and + or
    if (Array.isArray(node.and)) {
      node.and.forEach((sub: any) =>
        handleNode(sub, { neg: ctx.neg, inOr: ctx.inOr, intoGroup: ctx.intoGroup }),
      )
      compositeHandled = true
    }

    // OR: build branches; compress homogeneous include-only branches; push deltas
    if (Array.isArray(node.or)) {
      const branches: GroupFilter[] = []
      node.or.forEach((opt: any) => {
        const gLocal: GroupFilter = {}
        const prevSearch = searchTerm
        handleNode(opt, { neg: ctx.neg, inOr: true, intoGroup: gLocal })
        if (Object.keys(gLocal).length > 0) branches.push(gLocal)
        if (prevSearch && searchTerm && searchTerm !== prevSearch) {
          /* warned elsewhere */
        }
      })
      const compressed = compressHomogeneousOrBranches(branches)
      compressed.forEach((g) => orGroups.push(g))
      compositeHandled = true
    }

    if (compositeHandled) return

    // Leaves
    const fields: LeafField[] = [
      'timestamp',
      'platform',
      'channel',
      'type',
      'organizationId',
      'memberId',
      'id',
      'title',
      'body',
    ]
    let touched = false
    for (const f of fields) {
      if (node[f]) {
        const delta = leafToDelta(f, node[f], ctx.neg, ctx.inOr)
        if (
          'startDate' in delta ||
          'endDate' in delta ||
          'searchTerm' in delta ||
          '_ignored' in delta
        ) {
          if ((delta as any).startDate) startDate = (delta as any).startDate
          if ((delta as any).endDate) endDate = (delta as any).endDate
          if ((delta as any).searchTerm) absorbSearch((delta as any).searchTerm)
        } else {
          const target = ctx.intoGroup ?? skeleton
          Object.assign(target, mergeGroup(target, delta as GroupFilter))
        }
        touched = true
      }
    }
    if (!touched) {
      /* ignore unknown */
    }
  }
}

/** Emit one group as CSV Tinybird params G{n}_* */
function emitGroup(params: TBParams, n: number, g: GroupFilter) {
  const pref = `G${n}_`
  pushCsv(params, pref + 'memberIds', g.memberIds)
  pushCsv(params, pref + 'memberIds_exclude', g.memberIds_exclude)
  pushCsv(params, pref + 'activityTypes', g.activityTypes)
  pushCsv(params, pref + 'activityTypes_exclude', g.activityTypes_exclude)
  pushCsv(params, pref + 'organizationIds', g.organizationIds)
  pushCsv(params, pref + 'organizationIds_exclude', g.organizationIds_exclude)
  pushCsv(params, pref + 'platforms', g.platforms)
  pushCsv(params, pref + 'platforms_exclude', g.platforms_exclude)
  pushCsv(params, pref + 'channels', g.channels)
  pushCsv(params, pref + 'channels_exclude', g.channels_exclude)
  pushCsv(params, pref + 'ids', g.ids)
  pushCsv(params, pref + 'ids_exclude', g.ids_exclude)
}

/** Public builder */
export function buildActivitiesParams(arg: ExtendedArgs): TBParams {
  const params: TBParams = {}

  // segments CSV
  const segmentsCsv = Array.isArray(arg.segmentIds)
    ? arg.segmentIds
        .map((s) => String(s).trim())
        .filter(Boolean)
        .join(',')
    : ''
  if (segmentsCsv) params.segments = segmentsCsv

  // pagination
  const pageSize = arg.noLimit === true ? 0 : (arg.limit ?? DEFAULT_PAGE_SIZE)
  const offset = arg.offset ?? 0
  params.pageSize = pageSize
  params.page = pageSize > 0 ? Math.floor(offset / Math.max(1, pageSize)) : 0

  // order & count
  params.orderBy = pickOrder(arg.orderBy)
  if ((arg as any).countOnly) params.countOnly = 1

  // parse logical filter
  const parsed = parseLogicalFilter(arg.filter)

  // search term (explicit override wins)
  const st =
    typeof arg.searchTerm === 'string' && arg.searchTerm.trim()
      ? arg.searchTerm.trim()
      : parsed.searchTerm
  if (st) params.searchTerm = st

  // base time window
  if (parsed.startDate) params.startDate = parsed.startDate
  if (parsed.endDate) params.endDate = parsed.endDate

  // groups (max 5)
  const MAX = 5
  if (parsed.groups.length > MAX) {
    console.warn(
      `[buildActivitiesParams] Received ${parsed.groups.length} OR groups; only ${MAX} supported. Extra groups will be ignored.`,
    )
  }
  parsed.groups.slice(0, MAX).forEach((g, i) => emitGroup(params, i + 1, g))

  return params
}
