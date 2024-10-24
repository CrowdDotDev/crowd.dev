/* eslint-disable no-continue */
import { LoggerBase } from '@crowd/logging'
import { IAttributes } from '@crowd/types'

import MemberAttributesRepository from '@/database/repositories/member/memberAttributesRepository'

import { IServiceOptions } from '../IServiceOptions'

export default class MemberAttributesService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  // Member attributes
  async list(memberId: string): Promise<IAttributes> {
    return MemberAttributesRepository.list(memberId, this.options)
  }

  // Update member attributes
  async update(memberId: string, data: IAttributes): Promise<IAttributes> {
    return MemberAttributesRepository.update(memberId, data, this.options)
  }
}
