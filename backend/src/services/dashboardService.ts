import { RedisCache } from '@crowd/redis'
import { DashboardTimeframe, FeatureFlag } from '@crowd/types'

import isFeatureEnabled from '@/feature-flags/isFeatureEnabled'

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

    const segmentsEnabled = await isFeatureEnabled(FeatureFlag.SEGMENTS, this.options)

    if (segmentsEnabled && !params.segment) {
      throw new Error(`SegmentId is required in segment enabled deployments!`)
    }

    // get default segment
    if (!segmentsEnabled) {
      params.segment = this.options.currentSegments[0].id
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
