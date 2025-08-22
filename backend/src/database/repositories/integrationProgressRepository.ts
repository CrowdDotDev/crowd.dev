import { QueryTypes } from 'sequelize'

import { Repos } from '@/serverless/integrations/types/regularTypes'
import { GitHubStats } from '@/serverless/integrations/usecases/github/rest/getRemoteStats'

import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from './sequelizeRepository'

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

  static async getDbStatsForGithub(
    repos: Repos,
    options: IRepositoryOptions,
  ): Promise<GitHubStats> {
    // TODO questdb to tinybird remove - it's here for linter to be happy
    options.log.info('getDbStatsForGithub', { repos })
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

    // const promises: Promise<any[]>[] = [
    //   options.qdb.query(starsQuery, {
    //     remotes,
    //   }),
    //   options.qdb.query(unstarsQuery, {
    //     remotes,
    //   }),
    //   options.qdb.query(forksQuery, {
    //     remotes,
    //   }),
    //   options.qdb.query(issuesOpenedQuery, {
    //     remotes,
    //   }),
    //   options.qdb.query(prOpenedQuery, {
    //     remotes,
    //   }),
    // ]

    // const results = await Promise.all(promises)
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
