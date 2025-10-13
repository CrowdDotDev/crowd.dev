import { QueryTypes } from 'sequelize'

import { Repos } from '@/serverless/integrations/types/regularTypes'
import { GitHubStats } from '@/serverless/integrations/usecases/github/rest/getRemoteStats'

import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from './sequelizeRepository'

class IntegrationProgressRepository {
  static createPayloadWithActivityType(
    activityTypes: string[],
    repos: Repos,
    segments: string[] = [],
  ) {
    return {
      filter: {
        and: [
          { platform: { in: ['github'] } },
          { or: repos.map((repo) => ({ channel: { eq: repo.url } })) },
          { type: { in: activityTypes } },
        ],
      },
      segmentIds: segments,
    }
  }

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

  static async getDbStatsForGithub(): Promise<GitHubStats> {
    // const tb = new TinybirdClient()

    // const promises: Promise<{ data: Counter }>[] = [
    //   queryActivitiesCounter(
    //     IntegrationProgressRepository.createPayloadWithActivityType(['star'], repos, segments),
    //     tb,
    //   ),
    //   queryActivitiesCounter(
    //     IntegrationProgressRepository.createPayloadWithActivityType(['unstar'], repos, segments),
    //     tb,
    //   ),
    //   queryActivitiesCounter(
    //     {
    //       ...IntegrationProgressRepository.createPayloadWithActivityType(['fork'], repos, segments),
    //       indirectFork: 1,
    //     },
    //     tb,
    //   ),
    //   queryActivitiesCounter(
    //     IntegrationProgressRepository.createPayloadWithActivityType(
    //       ['issues-opened'],
    //       repos,
    //       segments,
    //     ),
    //     tb,
    //   ),
    //   queryActivitiesCounter(
    //     IntegrationProgressRepository.createPayloadWithActivityType(
    //       ['pull_request-opened'],
    //       repos,
    //       segments,
    //     ),
    //     tb,
    //   ),
    // ]

    // const result = await Promise.all(promises)

    return {
      // stars: (result[0]?.data?.[0]?.count ?? 0) - (result[1]?.data?.[0]?.count ?? 0),
      // forks: result[2]?.data?.[0]?.count ?? 0,
      // totalIssues: result[3]?.data?.[0]?.count ?? 0,
      // totalPRs: result[4]?.data?.[0]?.count ?? 0,
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
