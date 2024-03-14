import { QueryTypes } from 'sequelize'
import SequelizeRepository from './sequelizeRepository'
import { IRepositoryOptions } from './IRepositoryOptions'

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
            select count(*) as "total",
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
}

export default IntegrationProgressRepository
