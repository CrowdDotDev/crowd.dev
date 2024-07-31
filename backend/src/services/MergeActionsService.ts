import { LoggerBase } from '@crowd/logging'
import { IServiceOptions } from './IServiceOptions'
import { MergeActionsRepository } from '@/database/repositories/mergeActionsRepository'

export default class MergeActionsService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  async query(args) {
    // filter merge actions that are in progress or error
    args.filter = {
      ...args.filter,
      state: ['in-progress', 'error'],
    }

    const results = await MergeActionsRepository.query(args, this.options)

    return results.map(result => ({
      primaryId: result.primaryId,
      secondaryId: result.secondaryId,
      state: result.state,
      // derive operation type from step and if step is null, default to merge
      'operation-type': result.step ? MergeActionsService.getOperationType(result.step) : 'merge',
    }))
  }

  static getOperationType(step) {
    if (step.startsWith('merge')) {
      return 'merge'
    } 

    return 'unmerge'
  }
}
