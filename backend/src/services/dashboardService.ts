import { RedisCache } from '@crowd/redis'
import { DashboardTimeframe } from '@crowd/types'

import { IServiceOptions } from './IServiceOptions'

interface IDashboardQueryParams {
  segment?: string
  platform?: string
  timeframe: DashboardTimeframe
}

export default class DashboardService {
  options: IServiceOptions

  constructor(options) {
    this.options = options
  }

  async get(params: IDashboardQueryParams) {
    if (!params.timeframe) {
      throw new Error(`Timeframe is required!`)
    }

    if (!Object.values(DashboardTimeframe).includes(params.timeframe)) {
      throw new Error(`Unsupported timeframe ${params.timeframe}!`)
    }

    if (!params.segment) {
      params.segment = this.options.currentSegments[0]?.id
    }

    if (!params.segment) {
      throw new Error('Valid segment ID is required')
    }

    let key = `${params.segment}:${params.timeframe}`
    if (params.platform) {
      key += `:${params.platform}`
    }

    const cache = new RedisCache('dashboard-cache', this.options.redis, this.options.log)
    const data = await cache.get(key)

    if (!data) {
      return {
        newMembers: {
          total: 0,
          previousPeriodTotal: 0,
          timeseries: null,
        },
        activeMembers: {
          total: 0,
          previousPeriodTotal: 0,
          timeseries: null,
        },
        newOrganizations: {
          total: 0,
          previousPeriodTotal: 0,
          timeseries: null,
        },
        activeOrganizations: {
          total: 0,
          previousPeriodTotal: 0,
          timeseries: null,
        },
        activity: {
          total: 0,
          previousPeriodTotal: 0,
          timeseries: null,
          bySentimentMood: null,
          byTypeAndPlatform: null,
        },
      }
    }

    return JSON.parse(data)
  }
}
