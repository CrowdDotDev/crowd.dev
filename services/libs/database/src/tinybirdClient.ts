import axios from 'axios'

export type QueryParams = Record<
  string,
  string | number | boolean | Date | (string | number | boolean)[] | undefined | null
>

export type PipeNames = 'activities_relations_filtered' | 'activities_daily_counts'

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

export type ActivityTimeseriesDatapoint = {
  date: string
  count: number
}

export class TinybirdClient {
  private host: string
  private token: string

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

    const result = await axios.get<T>(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
      },
    })

    // TODO: check the response type
    return result.data
  }
}
