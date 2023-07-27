import Sequelize from 'sequelize'
import { IRepositoryOptions } from './IRepositoryOptions'
import { AutomationCriteria, AutomationData } from '../types/automationTypes'
import { DbAutomationInsertData, DbAutomationUpdateData } from './types/automationTypes'
import { RepositoryBase } from './repositoryBase'

export default class AutomationRepository extends RepositoryBase<
  AutomationData,
  string,
  DbAutomationInsertData,
  DbAutomationUpdateData,
  AutomationCriteria
> {
  public constructor(options: IRepositoryOptions) {
    super(options, true)
  }

  static async countAll(database: any, tenantId: string): Promise<number> {
    const automationCount = await database.automation.count({
      where: {
        tenantId,
      },
      useMaster: true,
    })

    return automationCount
  }
}
