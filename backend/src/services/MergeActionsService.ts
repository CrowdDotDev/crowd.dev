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
    return MergeActionsRepository.query(args, this.options)
  }
}
