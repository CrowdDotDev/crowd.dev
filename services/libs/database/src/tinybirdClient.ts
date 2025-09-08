import axios from 'axios'

export type QueryParams = Record<
  string,
  string | number | boolean | (string | number | boolean)[] | undefined | null
>

export type PipeNames = 'activities_relations_filtered'

export class TinybirdClient {
  private host: string
  private token: string

  constructor({ host, token }: { host: string; token: string }) {
    if (!host || !token) {
      throw new Error('Tinybird: host and token are required')
    }
    this.host = host
    this.token = token
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

    const url = `${this.host}/v0/pipes/${encodeURIComponent(
      pipeName,
    )}.json${searchParams.toString() ? `?${searchParams}` : ''}`

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
