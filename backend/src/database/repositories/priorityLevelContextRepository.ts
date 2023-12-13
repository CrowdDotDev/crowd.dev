import { IQueuePriorityCalculationContext } from '@crowd/types'
import { QueryTypes } from 'sequelize'
import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from './sequelizeRepository'

export class PriorityLevelContextRepository {
  public constructor(private readonly options: IRepositoryOptions) {}

  public async loadPriorityLevelContext(
    tenantId: string,
  ): Promise<IQueuePriorityCalculationContext> {
    const seq = SequelizeRepository.getSequelize(this.options)

    const results = await seq.query(
      `select plan, "priorityLevel" as "dbPriority" from tenants where id = :tenantId`,
      {
        replacements: {
          tenantId,
        },
        type: QueryTypes.SELECT,
      },
    )

    if (results.length === 1) {
      return results[0] as IQueuePriorityCalculationContext
    }

    throw new Error(`Tenant not found: ${tenantId}!`)
  }
}
