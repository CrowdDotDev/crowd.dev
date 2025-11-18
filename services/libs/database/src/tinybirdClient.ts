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

  constructor(token?: string) {
    this.host = process.env.CROWD_TINYBIRD_BASE_URL ?? 'https://api.tinybird.co'
    this.token = token ?? process.env.CROWD_TINYBIRD_ACTIVITIES_TOKEN ?? ''
  }

  /**
   * Get common headers for Tinybird API requests
   * @param contentType - Optional Content-Type header value (default: undefined)
   * @returns Headers object for axios requests
   */
  private getHeaders(contentType?: string): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/json',
    }

    if (contentType) {
      headers['Content-Type'] = contentType
    }

    return headers
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

    const result = await axios.get<T>(url, {
      headers: this.getHeaders(),
      httpsAgent: TinybirdClient.httpsAgent,
    })

    // TODO: check the response type
    return result.data
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

    const query = `% SELECT * FROM ${pipeName} FORMAT JSON`

    // Copy user params as-is, preserving arrays and primitives
    const bodyParams: Record<string, unknown> = { format: 'json' }
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue

      // Sanity: Tinybird accepts arrays, booleans, numbers, strings
      if (Array.isArray(v)) {
        bodyParams[k] = v.map((x) => String(x))
      } else if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        bodyParams[k] = v
      } else {
        // If you accidentally pass a Date here, throw to avoid silent mismatch
        throw new Error(
          `Unsupported param type for "${k}". Normalize to string/array/number/boolean.`,
        )
      }
    }

    return await this.executeSql<T>(query, bodyParams)
  }

  /**
   * Execute raw SQL query on Tinybird
   * Useful for queries that don't go through named pipes (e.g., ALTER TABLE, direct SELECT)
   */
  async executeSql<T = unknown>(query: string, bodyParams?: Record<string, unknown>): Promise<T> {
    const url = `${this.host}/v0/sql`
    const body: Record<string, unknown> = { q: query, ...bodyParams }

    const result = await axios.post<T>(url, body, {
      headers: this.getHeaders('application/json'),
      responseType: 'json',
      httpsAgent: TinybirdClient.httpsAgent,
    })

    return result.data
  }

  /**
   * Delete data from a Tinybird datasource using the delete API
   * See: https://www.tinybird.co/docs/classic/get-data-in/data-operations/replace-and-delete-data#delete-data-selectively
   *
   * @param datasourceName - Name of the datasource to delete from
   * @param deleteCondition - SQL expression filter (e.g., "repoId = 'xxx'", "id IN ('a', 'b')")
   * @returns Job response with job_id and job_url for tracking deletion progress
   */
  async deleteDatasource(
    datasourceName: string,
    deleteCondition: string,
  ): Promise<{
    id: string
    job_id: string
    job_url: string
    status: string
    job: {
      kind: string
      id: string
      job_id: string
      status: string
      datasource: {
        id: string
        name: string
      }
      delete_condition: string
    }
  }> {
    const url = `${this.host}/v0/datasources/${encodeURIComponent(datasourceName)}/delete`

    // Tinybird expects URL-encoded form data, not JSON
    const payload = `delete_condition=${encodeURIComponent(deleteCondition)}`

    const result = await axios.post(url, payload, {
      headers: this.getHeaders('application/x-www-form-urlencoded'),
      responseType: 'json',
      httpsAgent: TinybirdClient.httpsAgent,
    })

    return result.data
  }
}
