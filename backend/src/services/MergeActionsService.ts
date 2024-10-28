import { queryMergeActions } from '@crowd/data-access-layer/src/mergeActions/repo'
import { LoggerBase } from '@crowd/logging'

import SequelizeRepository from '@/database/repositories/sequelizeRepository'

import { IServiceOptions } from './IServiceOptions'

export default class MergeActionsService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  async query(args) {
    const qx = SequelizeRepository.getQueryExecutor(this.options)
    const results = await queryMergeActions(qx, args)

    return results.map((result) => ({
      primaryId: result.primaryId,
      secondaryId: result.secondaryId,
      state: result.state,
      // derive operation type from step and if step is null, default to merge
      operationType: result.step ? MergeActionsService.getOperationType(result.step) : 'merge',
    }))
  }

  static getOperationType(step) {
    if (step.startsWith('merge')) {
      return 'merge'
    }
    if (step.startsWith('unmerge')) {
      return 'unmerge'
    }

    throw new Error(`Unrecognized merge action step: ${step}`)
  }
}
