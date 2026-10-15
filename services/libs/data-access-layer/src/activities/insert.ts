import { pick } from 'lodash'
import moment from 'moment'

import { DEFAULT_TENANT_ID, generateUUIDv4 } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'
import { ACTIVITIES_QUEUE_SETTINGS, IQueue, QueueEmitter } from '@crowd/queue'
import telemetry from '@crowd/telemetry'

import { IDbActivityCreateData } from '../old/apps/data_sink_worker/repo/activity.data'
import { ACTIVITY_ALL_COLUMNS } from './sql'

const logger = getServiceChildLogger('insert-activities')

function isTrue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true'
  }

  return false
}

function toInt(value: unknown): number {
  if (value === null || value === undefined) {
    return 0
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const num = parseInt(value, 10)
    return isNaN(num) ? 0 : num
  }

  return 0
}

function truncateWithDots(s: string, max: number): string {
  if (!s || s.length <= max) {
    return s
  }

  // Cut by UTF-16 code units (fast, but may split surrogate pairs)
  let out = s.slice(0, max)

  // If the last code unit is a HIGH surrogate (D800–DBFF), drop it to avoid a dangling pair
  if (/[\uD800-\uDBFF]$/.test(out)) {
    out = out.slice(0, -1)
  }

  // Remove any trailing combining marks (prevents leaving accents/modifiers without a base)
  out = out.replace(/\p{M}+$/u, '')

  return out + '...'
}

export async function insertActivities(
  queueClient: IQueue,
  activities: IDbActivityCreateData[],
): Promise<string[]> {
  const now = moment().toISOString()

  const toInsert = activities
    .map((activity) => {
      const id = activity.id || generateUUIDv4()

      return {
        // we keep these ones in front of `...activity` because these fields might exist in the activity object
        member_isBot: activity.isBotActivity || false,
        member_isTeamMember: activity.isTeamMemberActivity || false,
        gitIsMainBranch: isTrue(activity.attributes['isMainBranch']),
        gitIsIndirectFork: isTrue(activity.attributes['isIndirectFork']),
        gitInsertions: activity.attributes['insertions']
          ? toInt(activity.attributes['insertions'])
          : toInt(activity.attributes['additions']),
        gitDeletions: toInt(activity.attributes['deletions']),
        gitLines: toInt(activity.attributes['lines']),
        gitIsMerge: isTrue(activity.attributes['isMerge']),

        ...activity,

        id,
        updatedAt: now,
        createdAt: activity.createdAt ? moment(activity.createdAt).toISOString() : now,
        timestamp: activity.timestamp ? moment(activity.timestamp).toISOString() : now,
        attributes: objectToBytes(tryToUnwrapAttributes(activity.attributes), (degradation) =>
          logger.warn(
            {
              activityId: id,
              platform: activity.platform,
              type: activity.type,
              sourceId: activity.sourceId,
              degradation,
              maxBytes: ATTRIBUTES_MAX_BYTES,
            },
            'Activity attributes exceeded the size cap and were reduced!',
          ),
        ),
        body: truncateWithDots(activity.body, 2000),

        // This is being added here temporarily, just to ensure we keep sending isContribution to Kafka
        // (and thus, Tinybird) after removing it from everywhere else, but this is meant to go away after we remove the
        // actual column.
        isContribution: false,
      }
    })
    .map((activity) => {
      return {
        // isContribution is added here because it was removed from ACTIVITY_ALL_COLUMNS but just as described a few
        // lines up, we still want to send it to Kafka for now. We should remove this once we remove the column from
        // Tinybird.
        ...pick(activity, [...ACTIVITY_ALL_COLUMNS, 'isContribution']),
        tenantId: DEFAULT_TENANT_ID,
      }
    })

  const emitter = new QueueEmitter(queueClient, ACTIVITIES_QUEUE_SETTINGS, logger)

  const commitTimestamp = new Date().toISOString()
  const bulk = toInsert.map((row) => {
    logger.debug(
      {
        activityId: row.id,
        queue: ACTIVITIES_QUEUE_SETTINGS.name,
      },
      'Dispatching activity to queue!',
    )
    return {
      payload: { ...row, metadata: { commit_timestamp: commitTimestamp } },
      groupId: generateUUIDv4(),
      deduplicationId: generateUUIDv4(),
    }
  })

  const chunks: (typeof bulk)[] = []
  for (let i = 0; i < bulk.length; i += 10) {
    chunks.push(bulk.slice(i, i + 10))
  }
  await Promise.all(chunks.map((chunk) => emitter.sendMessages(chunk)))
  telemetry.increment('tinybird.insert_activity', activities.length)

  return toInsert.map((activity) => activity.id)
}

const ATTRIBUTE_STRING_MAX_LENGTH = 500

// Upper bound on the serialized (UTF-8) size of an activity's attributes. Every platform goes through the same cap so
// a single activity with many attributes can't bloat the Kafka message or the Tinybird row. 16 KiB is 8x the old
// 2000-byte QuestDB-era limit and keeps a 10-message Kafka batch far below the 1 MB broker default.
export const ATTRIBUTES_MAX_BYTES = 16 * 1024

// Per-string limits tried, in order, when the attributes are still over ATTRIBUTES_MAX_BYTES after the default trim.
const ATTRIBUTE_STRING_FALLBACK_LENGTHS = [200, 100, 50]

export type AttributesDegradation = 'none' | 'strings-shortened' | 'values-pruned'

function objectToBytes(
  input: object,
  onDegraded: (degradation: AttributesDegradation) => void,
): string {
  if (typeof input !== 'object') {
    return input
  }

  const { json, degradation } = serializeAttributes(input ?? {})
  if (degradation !== 'none') {
    onDegraded(degradation)
  }
  return json
}

/**
 * Serializes activity attributes to JSON no larger than ATTRIBUTES_MAX_BYTES.
 * 1. Every string is trimmed to ATTRIBUTE_STRING_MAX_LENGTH characters; under the cap that is the result.
 * 2. Otherwise strings are trimmed to progressively shorter lengths, keeping every key.
 * 3. If still over, the largest values are pruned (largest first; ties by key, array items from the end): a nested
 *    object or array is pruned
 *    the same way from the inside, anything else is dropped. Small scalars are the last to go.
 */
export function serializeAttributes(attributes: object): {
  json: string
  degradation: AttributesDegradation
} {
  let trimmed = trimAttributeStrings(attributes)
  let json = JSON.stringify(trimmed)
  if (fitsCap(json)) {
    return { json, degradation: 'none' }
  }

  for (const maxLength of ATTRIBUTE_STRING_FALLBACK_LENGTHS) {
    // trimming the already-trimmed copy gives the same result as trimming the original, on a smaller input
    trimmed = trimAttributeStrings(trimmed, maxLength)
    json = JSON.stringify(trimmed)
    if (fitsCap(json)) {
      return { json, degradation: 'strings-shortened' }
    }
  }

  return {
    json: JSON.stringify(pruneToFit(trimmed as object, ATTRIBUTES_MAX_BYTES)),
    degradation: 'values-pruned',
  }
}

export function trimAttributeStrings(
  value: unknown,
  maxLength: number = ATTRIBUTE_STRING_MAX_LENGTH,
): unknown {
  if (typeof value === 'string') {
    return truncateWithDots(value, maxLength)
  }
  if (Array.isArray(value)) {
    return value.map((item) => trimAttributeStrings(item, maxLength))
  }
  if (value && typeof value === 'object') {
    // keep what JSON.stringify would produce for values like Date instead of turning them into {}
    if (typeof (value as { toJSON?: unknown }).toJSON === 'function') {
      return trimAttributeStrings((value as { toJSON: () => unknown }).toJSON(), maxLength)
    }
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, trimAttributeStrings(v, maxLength)]),
    )
  }
  return value
}

// A UTF-8 string is never more than 3 bytes per UTF-16 code unit, so short strings skip the byte count.
function fitsCap(json: string): boolean {
  return json.length * 3 <= ATTRIBUTES_MAX_BYTES || byteLength(json) <= ATTRIBUTES_MAX_BYTES
}

/**
 * Returns a copy of a (JSON-safe) object or array whose serialization is at most maxBytes. Entry sizes are computed
 * once and subtracted as entries are dropped, so the cost stays linear in the size of the input per nesting level.
 */
function pruneToFit(value: object, maxBytes: number): object {
  const isArray = Array.isArray(value)
  const entries = Object.entries(value).map(([key, v]) => {
    const valueJson = JSON.stringify(v)
    // undefined / functions: skipped inside objects, serialized as null inside arrays
    const valueBytes = valueJson === undefined ? (isArray ? 4 : 0) : byteLength(valueJson)
    const size =
      isArray || valueJson === undefined
        ? valueBytes
        : byteLength(JSON.stringify(key)) + 1 + valueBytes
    return { key, value: v as unknown, valueBytes, size, keep: true }
  })

  const present = entries.filter((e) => e.size > 0)
  let total = 2 + present.reduce((sum, e) => sum + e.size, 0) + Math.max(present.length - 1, 0)
  let count = present.length

  // ties: object keys alphabetically, array items from the end so the head of a list survives
  const tieBreak = isArray
    ? (a: { key: string }, b: { key: string }) => Number(b.key) - Number(a.key)
    : (a: { key: string }, b: { key: string }) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)
  const bySizeDesc = [...present].sort((a, b) => b.size - a.size || tieBreak(a, b))

  for (const entry of bySizeDesc) {
    if (total <= maxBytes) {
      break
    }

    const excess = total - maxBytes
    const child = entry.value
    if (child && typeof child === 'object' && entry.valueBytes - excess >= 2) {
      // shrink the nested container just enough instead of losing all of it
      entry.value = pruneToFit(child, entry.valueBytes - excess)
      const newBytes = byteLength(JSON.stringify(entry.value))
      total -= entry.valueBytes - newBytes
      entry.valueBytes = newBytes
      continue
    }

    entry.keep = false
    total -= entry.size + (count > 1 ? 1 : 0)
    count -= 1
  }

  const kept = entries.filter((e) => e.keep)
  return isArray ? kept.map((e) => e.value) : Object.fromEntries(kept.map((e) => [e.key, e.value]))
}

function byteLength(s: string): number {
  return Buffer.byteLength(s, 'utf8')
}

function tryToUnwrapAttributes(attributes: string | object): object {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (typeof attributes === 'object') {
      return attributes
    }
    attributes = JSON.parse(attributes)
  }
}
