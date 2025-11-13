import axios from 'axios'
import https from 'https'

export type QueryParams = Record<
  string,
  string | number | boolean | Date | (string | number | boolean)[] | undefined | null
>

export type PipeNames = 'activities_relations_filtered' | 'activities_daily_counts'

export type ActivityRelations = {
  activityId: string
  channel: string
  memberId: string
  organizationId: string
  platform: string
  segmentId: string
  sourceId: string
  sourceParentId: string
  timestamp: Date
  type: string
  attributes: string
  url: string
  body: string
  title: string
}

export type ActivityTimeseriesDatapoint = {
  date: string
  count: number
}

export type Counter = {
  count: number
}

export class TinybirdClient {
  private host: string
  private token: string

  private static httpsAgent = new https.Agent({
    keepAlive: false, // Disable keep-alive to avoid stale socket reuse
  })

  constructor() {
    this.host = process.env.CROWD_TINYBIRD_BASE_URL ?? 'https://api.tinybird.co'
    this.token = process.env.CROWD_TINYBIRD_ACTIVITIES_TOKEN ?? ''
  }

  /**
   * Call a Tinybird pipe in JSON format.
   */
  async pipe<T = unknown>(pipeName: PipeNames, params: QueryParams = {}): Promise<T> {
    const searchParams = new URLSearchParams()

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue

      if (Array.isArray(value)) {
        // join array values in comma-separated string
        searchParams.set(key, value.map((v) => String(v)).join(','))
      } else {
        searchParams.set(key, String(value))
      }
    }

    const url = `${this.host}/v0/pipes/${encodeURIComponent(pipeName)}.json${
      searchParams.toString() ? `?${searchParams}` : ''
    }`
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await axios.get<T>(url, {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/json',
          },
          httpsAgent: TinybirdClient.httpsAgent,
        })
        return result.data
      } catch (error) {
        if (error?.response?.status === 408 && attempt < 3) {
          await new Promise((res) => setTimeout(res, 1000)) // wait before retrying
          continue // retry
        }
        throw error
      }
    }
  }

  /**
   * POST to /v0/sql to avoid URL length limits and send typed parameters.
   */
  async pipeSql<T = unknown>(pipeName: PipeNames, params: QueryParams = {}): Promise<T> {
    // Guard against reserved keys
    const RESERVED_KEYS = new Set(['q', 'pipeline'])
    for (const k of Object.keys(params)) {
      if (RESERVED_KEYS.has(k)) {
        throw new Error(`Parameter "${k}" collides with a reserved Query API key`)
      }
    }

    // Compose the final request body
    const url = `${this.host}/v0/sql`
    const body: Record<string, unknown> = {
      q: `% SELECT * FROM ${pipeName} FORMAT JSON`,
      format: 'json',
    }

    // Copy user params as-is, preserving arrays and primitives
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue
      // Sanity: Tinybird accepts arrays, booleans, numbers, strings
      if (Array.isArray(v)) {
        body[k] = v.map((x) => String(x))
      } else if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        body[k] = v
      } else {
        // If you accidentally pass a Date here, throw to avoid silent mismatch
        throw new Error(
          `Unsupported param type for "${k}". Normalize to string/array/number/boolean.`,
        )
      }
    }

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await axios.post<T>(url, body, {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          responseType: 'json',
          httpsAgent: TinybirdClient.httpsAgent,
        })

        return result.data
      } catch (error) {
        if (error?.response?.status === 408 && attempt < 3) {
          await new Promise((res) => setTimeout(res, 1000)) // wait before retrying
          continue // retry
        }
        throw error
      }
    }
  }
}
