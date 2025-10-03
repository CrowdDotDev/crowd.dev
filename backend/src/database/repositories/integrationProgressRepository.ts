import { QueryTypes } from 'sequelize'

import { Repos } from '@/serverless/integrations/types/regularTypes'
import { GitHubStats } from '@/serverless/integrations/usecases/github/rest/getRemoteStats'

import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from './sequelizeRepository'
import { TinybirdClient } from '@crowd/data-access-layer/src/database'

class IntegrationProgressRepository {
  static async getPendingStreamsCount(integrationId: string, options: IRepositoryOptions) {
    const transaction = options.transaction
    const seq = SequelizeRepository.getSequelize(options)

    const lastRunId = await IntegrationProgressRepository.getLastRunId(integrationId, options)

    if (!lastRunId) {
      return 0
    }

    const result = await seq.query(
      `
            select count(*) as "total"
            from integration.streams
            where "integrationId" = :integrationId
            and "runId" = :lastRunId
            and "state" = 'pending'
            `,
      {
        replacements: {
          integrationId,
          lastRunId,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return (result[0] as any).total as number
  }

  static async getLastRunId(integrationId: string, options: IRepositoryOptions) {
    const transaction = options.transaction
    const seq = SequelizeRepository.getSequelize(options)

    const result = await seq.query(
      `
        select id
        from integration.runs
        where "integrationId" = :integrationId
        order by "createdAt" desc
        limit 1
        `,
      {
        replacements: {
          integrationId,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    if (result.length === 0) {
      return null
    }

    return (result[0] as any).id as string
  }

  static async getDbStatsForGithub({
    options,
    repos,
    segmentIds,
  }:{
    options: IRepositoryOptions,
    repos: Repos,
    segmentIds: string[],
  }
  ): Promise<GitHubStats> {
    // TODO questdb to tinybird remove - it's here for linter to be happy
    options.log.info('Repos to query', { repos })
    options.log.info('Segment IDs to query', { segmentIds })
    const tb = new TinybirdClient()
    
    segmentIds = ["5c43e166-28c1-4408-b830-e220876e0d4e"]
    repos = ["https://github.com/apache/dubbo","https://github.com/apache/spark"]

    const repos2: Repos = [
      {
        url: 'https://github.com/apache/dubbo',
        name: 'dubbo',
        owner: 'apache',
        private: false,
      },{
        url: 'https://github.com/apache/spark',
        name: 'spark',
        owner: 'apache',
        private: false,
      }
    ]

    const params = {
      G1_platform: 'github',
      G1_channel: repos2.map((r) => r.url).join(','),
      countOnly: 1,
      segments: segmentIds.join(','),
    }

    // const starsQueryParams = {
    //   G1_activityType: 'star',
    //   G1_platform: 'github',
    //   G1_channel: repos2.map((r) => r.url).join(','),
    //   segments: segmentIds.join(','),
    //   countOnly: 1,
    // }
    // TODO questdb to tinybird
    // const starsQuery = `
    //   SELECT COUNT_DISTINCT("sourceId") AS count
    //   FROM activities
    //   WHERE platform = 'github'
    //   AND type = 'star'
    //   AND "deletedAt" IS NULL
    //   AND channel IN ($(remotes:csv))
    // `

    // const unstarsQuery = `
    //   SELECT COUNT_DISTINCT("sourceId") AS count
    //   FROM activities
    //   WHERE platform = 'github'
    //   AND type = 'unstar'
    //   AND "deletedAt" IS NULL
    //   AND channel IN ($(remotes:csv))
    // `

    // const forksQuery = `
    //   SELECT COUNT_DISTINCT("sourceId") AS count
    //   FROM activities
    //   WHERE platform = 'github'
    //   AND type = 'fork'
    //   AND "deletedAt" IS NULL
    //   AND "gitIsIndirectFork" != TRUE
    //   AND channel IN ($(remotes:csv))
    // `

    // const issuesOpenedQuery = `
    //   SELECT COUNT_DISTINCT("sourceId") AS count
    //   FROM activities
    //   WHERE platform = 'github'
    //   AND type = 'issues-opened'
    //   AND "deletedAt" IS NULL
    //   AND channel IN ($(remotes:csv))
    // `

    // const prOpenedQuery = `
    //   SELECT COUNT_DISTINCT("sourceId") AS count
    //   FROM activities
    //   WHERE platform = 'github'
    //   AND type = 'pull_request-opened'
    //   AND "deletedAt" IS NULL
    //   AND channel IN ($(remotes:csv))
    // `

    // const remotes = repos.map((r) => r.url)

    console.log(`Querying with params:`, params)

    const promises: Promise<any[]>[] = [
      tb.pipe('activities_relations_filtered', {
        ...params,
        G1_activityType: 'star',
      }),
      tb.pipe('activities_relations_filtered', {
        ...params,
        G1_activityType: 'unstar',
      }),
      tb.pipe('activities_relations_filtered', {
        ...params,
        indirectFork: 1,
      }),
      tb.pipe('activities_relations_filtered', {
        ...params,
        G1_activityType: 'issues-opened',
      }),
      tb.pipe('activities_relations_filtered', {
        ...params,
        G1_activityType: 'pull_request-opened',
      }),
    ]

    const results = await Promise.all(promises)
    console.log('DB stats results:', JSON.stringify(results))

    return {
      // stars: parseInt(results[0][0].count, 10) - parseInt(results[1][0].count, 10),
      // forks: parseInt(results[2][0].count, 10),
      // totalIssues: parseInt(results[3][0].count, 10),
      // totalPRs: parseInt(results[4][0].count, 10),
      stars: 0,
      forks: 0,
      totalIssues: 0,
      totalPRs: 0,
    }
  }

  static async getAllIntegrationsInProgressForSegment(
    options: IRepositoryOptions,
  ): Promise<string[]> {
    const transaction = options.transaction
    const seq = SequelizeRepository.getSequelize(options)
    const segment = SequelizeRepository.getStrictlySingleActiveSegment(options)

    const result = await seq.query(
      `
      select id
      from integrations
      where 
        "status" = 'in-progress'
        and "segmentId" = :segmentId
        and "deletedAt" is null
      `,
      {
        replacements: {
          segmentId: segment.id,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return result.map((r: any) => r.id)
  }

  static async getAllIntegrationsInProgressForMultipleSegments(
    options: IRepositoryOptions,
  ): Promise<string[]> {
    const transaction = options.transaction
    const seq = SequelizeRepository.getSequelize(options)
    const segments = SequelizeRepository.getCurrentSegments(options)

    const result = await seq.query(
      `
      select id
      from integrations
      where 
        "status" = 'in-progress'
        and "segmentId" in (:segmentIds)
        and "deletedAt" is null
      `,
      {
        replacements: {
          segmentIds: segments.map((s) => s.id),
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return result.map((r: any) => r.id)
  }
}

export default IntegrationProgressRepository
