import axios, { AxiosError, type RawAxiosRequestHeaders } from 'axios'
import { Agent as HttpAgent } from 'http'
import { Agent as HttpsAgent } from 'https'

export type QueryParams = Record<
  string,
  string | number | boolean | (string | number | boolean)[] | undefined | null
>

export type PipeNames = 'activities_relations_filtered'

export type ActivityRelations = {
  activityId: string
  channel: string
  isContribution: string
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

export class TinybirdClient {
  private host: string
  private token: string
  private api = axios.create({
    timeout: 30000, // timeout client
    httpAgent: new HttpAgent({ keepAlive: true, maxSockets: 100 }),
    httpsAgent: new HttpsAgent({ keepAlive: true, maxSockets: 100 }),
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    validateStatus: (s) => (s >= 200 && s < 300) || s === 408,
  })

  constructor() {
    this.host = process.env.CROWD_TINYBIRD_BASE_URL ?? 'https://api.tinybird.co'
    this.token = process.env.CROWD_TINYBIRD_ACTIVITIES_TOKEN ?? ''
    if (!this.token) {
      throw new Error('CROWD_TINYBIRD_ACTIVITIES_TOKEN mancante')
    }
  }

  private buildSearch(params: QueryParams) {
    const sp = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue
      if (Array.isArray(value)) {
        sp.set(key, value.map((v) => String(v)).join(','))
      } else {
        sp.set(key, String(value))
      }
    }
    return sp
  }

  async pipe<T = unknown>(pipeName: PipeNames, params: QueryParams = {}): Promise<T> {
    const searchParams = this.buildSearch(params)
    const url = `${this.host}/v0/pipes/${encodeURIComponent(pipeName)}.json${searchParams.toString() ? `?${searchParams}` : ''}`

    const headers: RawAxiosRequestHeaders = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/json',
    }

    const maxRetries = 3

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const res = await this.api.get<T>(url, { headers })

      if (res.status !== 408) {
        return res.data as T
      }

      if (attempt === maxRetries) {
        throw new AxiosError(
          'Tinybird query timeout (HTTP 408)',
          undefined,
          res.config,
          undefined,
          res as unknown,
        )
      }

      const delay = Math.min(1000 * 2 ** (attempt - 1), 8000)
      await new Promise((r) => setTimeout(r, delay))
    }

    throw new Error('Unexpected control flow in TinybirdClient.pipe')
  }
}
