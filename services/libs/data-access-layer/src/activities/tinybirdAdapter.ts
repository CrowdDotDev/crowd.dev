import { IQueryActivitiesParameters } from './types'

/* =========================
 * Constants & basic helpers
 * ========================= */

const DEFAULT_PAGE_SIZE = 20 as const

type OrderValue = 'timestamp_DESC' | 'timestamp_ASC' | 'createdAt_DESC' | 'createdAt_ASC'
const ORDER_ALLOW: ReadonlySet<OrderValue> = new Set([
  'timestamp_DESC',
  'timestamp_ASC',
  'createdAt_DESC',
  'createdAt_ASC',
])

/** Pick the first valid orderBy, default to 'timestamp_DESC' */
const pickOrder = (orderBy?: string[]): OrderValue => {
  if (!orderBy || orderBy.length === 0) return 'timestamp_DESC'
  const first = (
    orderBy.find((o) => typeof o === 'string' && o.trim().length > 0) || ''
  ).trim() as OrderValue
  return ORDER_ALLOW.has(first) ? first : 'timestamp_DESC'
}

/** Normalize a string or string[] into a trimmed, unique array */
const normArr = (x?: string | string[]): string[] | undefined => {
  if (typeof x === 'string') {
    const t = x.trim()
    return t ? [t] : undefined
  }
  if (Array.isArray(x)) {
    const out = Array.from(new Set(x.map((s) => String(s).trim()).filter(Boolean)))
    return out.length ? out : undefined
  }
  return undefined
}

/** Push CSV param if non-empty */
type TBParams = Record<string, string | number | boolean>
const pushCsv = (p: TBParams, key: string, v?: string[] | string): void => {
  const arr = normArr(v)
  if (arr && arr.length) p[key] = arr.join(',')
}

/* =========================
 * Groups typing & utilities
 * ========================= */

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

type GroupKey = keyof GroupFilter
const INCLUDE_KEYS = [
  'memberIds',
  'activityTypes',
  'organizationIds',
  'platforms',
  'channels',
  'ids',
] as const
const EXCLUDE_KEYS = [
  'memberIds_exclude',
  'activityTypes_exclude',
  'organizationIds_exclude',
  'platforms_exclude',
  'channels_exclude',
  'ids_exclude',
] as const
const ALL_KEYS: readonly GroupKey[] = [...INCLUDE_KEYS, ...EXCLUDE_KEYS]

const getVals = <K extends GroupKey>(g: GroupFilter, k: K): string[] | undefined => normArr(g[k])
const setVals = <K extends GroupKey>(g: GroupFilter, k: K, v?: string[] | string): void => {
  if (v !== undefined) g[k] = v
  else delete g[k]
}

/** Merge b into a (union of values per key) */
const mergeGroup = (a: GroupFilter, b: GroupFilter): GroupFilter => {
  const out: GroupFilter = { ...a }
  for (const k of ALL_KEYS) {
    const na = getVals(a, k)
    const nb = getVals(b, k)
    if (na && nb) setVals(out, k, Array.from(new Set([...na, ...nb])))
    else if (nb) setVals(out, k, nb)
  }
  return out
}

/* =========================
 * Public args (extended)
 * ========================= */

type ExtendedArgs = IQueryActivitiesParameters & {
  /** Optional explicit search term override */
  searchTerm?: string
  /** Optional pre-built OR groups */
  groups?: GroupFilter[]
  /** Logical filter (and/or/not, leaves) */
  filter?: unknown
  /** In case IQueryActivitiesParameters doesn't include it */
  countOnly?: boolean
}

/* =========================
 * Logical filter parsing
 * ========================= */

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

/** Map field → group keys (include/exclude) */
const KEY_MAP = {
  platform: { inc: 'platforms', exc: 'platforms_exclude' },
  channel: { inc: 'channels', exc: 'channels_exclude' },
  type: { inc: 'activityTypes', exc: 'activityTypes_exclude' },
  organizationId: { inc: 'organizationIds', exc: 'organizationIds_exclude' },
  memberId: { inc: 'memberIds', exc: 'memberIds_exclude' },
  id: { inc: 'ids', exc: 'ids_exclude' },
} as const satisfies Record<
  Exclude<LeafField, 'timestamp' | 'title' | 'body'>,
  { inc: GroupKey; exc: GroupKey }
>

/* ---- Delta types: discriminated union ---- */

type MetaDelta = { startDate?: string; endDate?: string; searchTerm?: string; ignored?: true }
type Delta = { kind: 'group'; group: GroupFilter } | { kind: 'meta'; meta: MetaDelta }

const asGroup = (g: GroupFilter): Delta => ({ kind: 'group', group: g })
const asMeta = (m: MetaDelta): Delta => ({ kind: 'meta', meta: m })

/** One leaf predicate → Delta (group/meta) */
const leafToDelta = (field: LeafField, pred: unknown, neg: boolean, inOr: boolean): Delta => {
  // timestamp → base AND window only (ignore inside OR / negated)
  if (field === 'timestamp') {
    if (inOr) return asMeta({ ignored: true })
    if (neg) return asMeta({ ignored: true })
    const p = pred as { gte?: string; gt?: string; lte?: string; lt?: string }
    const meta: MetaDelta = {}
    if (p?.gte || p?.gt) meta.startDate = String(p.gte ?? p.gt)
    if (p?.lte || p?.lt) meta.endDate = String(p.lte ?? p.lt)
    return asMeta(meta)
  }

  // textContains → global searchTerm (AND with everything)
  if (
    typeof pred === 'object' &&
    pred !== null &&
    'textContains' in (pred as Record<string, unknown>)
  ) {
    const val = String((pred as Record<'textContains', unknown>).textContains || '').trim()
    if (!val) return asMeta({})
    if (neg) return asMeta({ ignored: true })
    return asMeta({ searchTerm: val })
  }

  // include/exclude → groups
  if (field in KEY_MAP) {
    const { inc, exc } = KEY_MAP[field as keyof typeof KEY_MAP]
    const pv = pred as { in?: string[] | string; eq?: string }
    const values = normArr(pv?.in) ?? normArr(pv?.eq)
    if (!values || !values.length) return asMeta({})
    const g: GroupFilter = neg
      ? ({ [exc]: values } as GroupFilter)
      : ({ [inc]: values } as GroupFilter)
    return asGroup(g)
  }

  return asMeta({})
}

/** If all branches are include-only on the same field → compress into one group */
const getSingleIncludeKey = (g: GroupFilter): GroupKey | null => {
  for (const k of EXCLUDE_KEYS) if (getVals(g, k)) return null
  const present: GroupKey[] = []
  for (const k of INCLUDE_KEYS) if (getVals(g, k)) present.push(k)
  return present.length === 1 ? present[0] : null
}

const compressHomogeneousOrBranches = (branches: GroupFilter[]): GroupFilter[] => {
  const nonEmpty = branches.filter((g) => Object.keys(g).length > 0)
  if (nonEmpty.length <= 1) return nonEmpty
  const firstKey = getSingleIncludeKey(nonEmpty[0])
  if (!firstKey) return nonEmpty
  for (let i = 1; i < nonEmpty.length; i++) {
    if (getSingleIncludeKey(nonEmpty[i]) !== firstKey) return nonEmpty
  }
  const merged: GroupFilter = {}
  const allVals = nonEmpty.flatMap((g) => getVals(g, firstKey) ?? [])
  setVals(merged, firstKey, Array.from(new Set(allVals)))
  return [merged]
}

/** Runtime guards for unknown input */
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null
const isArr = (x: unknown): x is unknown[] => Array.isArray(x)

type NodeCtx = { neg: boolean; inOr: boolean; intoGroup?: GroupFilter }
type Parsed = { groups: GroupFilter[]; startDate?: string; endDate?: string; searchTerm?: string }

/** Parse logical filter (and/or/not + leaves) → { groups, startDate, endDate, searchTerm } */
function parseLogicalFilter(filter: unknown): Parsed {
  if (!isObj(filter)) return { groups: [] }

  const skeleton: GroupFilter = {}
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

  const handleNode = (node: unknown, ctx: NodeCtx): void => {
    if (!isObj(node)) return

    // NOT (if present)
    if ('not' in node) {
      handleNode((node as Record<string, unknown>).not, {
        neg: !ctx.neg,
        inOr: ctx.inOr,
        intoGroup: ctx.intoGroup,
      })
    }

    let compositeHandled = false

    // AND
    if ('and' in node && isArr((node as Record<string, unknown>).and)) {
      for (const sub of (node as Record<string, unknown>).and as unknown[]) {
        handleNode(sub, { neg: ctx.neg, inOr: ctx.inOr, intoGroup: ctx.intoGroup })
      }
      compositeHandled = true
    }

    // OR
    if ('or' in node && isArr((node as Record<string, unknown>).or)) {
      const branches: GroupFilter[] = []
      for (const opt of (node as Record<string, unknown>).or as unknown[]) {
        const gLocal: GroupFilter = {}
        const prevSearch = searchTerm
        handleNode(opt, { neg: ctx.neg, inOr: true, intoGroup: gLocal })
        if (Object.keys(gLocal).length > 0) branches.push(gLocal)
        if (prevSearch && searchTerm && searchTerm !== prevSearch) {
          /* already warned */
        }
      }
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
    for (const f of fields) {
      if (f in node) {
        const delta = leafToDelta(f, (node as Record<string, unknown>)[f], ctx.neg, ctx.inOr)
        if (delta.kind === 'meta') {
          const { startDate: sd, endDate: ed, searchTerm: st } = delta.meta
          if (sd) startDate = sd
          if (ed) endDate = ed
          if (st) absorbSearch(st)
        } else {
          const target = ctx.intoGroup ?? skeleton
          Object.assign(target, mergeGroup(target, delta.group))
        }
      }
    }
  }

  // Root: accumulate base AND leaves into skeleton
  handleNode(filter, { neg: false, inOr: false, intoGroup: undefined })

  // Build final groups
  const groups =
    orGroups.length > 0
      ? orGroups.map((g) => mergeGroup(skeleton, g))
      : Object.keys(skeleton).length
        ? [skeleton]
        : []

  return { groups, startDate, endDate, searchTerm }
}

/* =========================
 * Emit Tinybird params
 * ========================= */

const emitGroup = (params: TBParams, n: number, g: GroupFilter): void => {
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

/* =========================
 * Public builder
 * ========================= */

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
  if (arg.countOnly) params.countOnly = 1

  // parse logical filter (preferred)
  const parsed = parseLogicalFilter(arg.filter)

  // search term (explicit override wins)
  const st =
    typeof arg.searchTerm === 'string' && arg.searchTerm.trim()
      ? arg.searchTerm.trim()
      : parsed.searchTerm
  if (st) params.searchTerm = st

  // base time window (AND)
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
