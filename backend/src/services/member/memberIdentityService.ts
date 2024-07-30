/* eslint-disable no-continue */

import { LoggerBase } from '@crowd/logging'
import {IMemberIdentity} from "@crowd/types"
import { IServiceOptions } from '../IServiceOptions'
import MemberIdentityRepository from "@/database/repositories/member/memberIdentityRepository"

export default class MemberIdentityService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

    // Member identity list
    async list(memberId: string): Promise<IMemberIdentity[]> {
        return MemberIdentityRepository.list(memberId, this.options)
    }

    // Member identity creation
    async create(memberId: string, data: any): Promise<IMemberIdentity[]> {
        return MemberIdentityRepository.create(memberId, data, this.options)
    }

    // Update member identity
    async update(id: string, memberId: string, data: any): Promise<IMemberIdentity[]> {
        return MemberIdentityRepository.update(id, memberId, data, this.options)
    }

    // Delete member identity
    async delete(id: string, memberId: string): Promise<IMemberIdentity[]> {
        return MemberIdentityRepository.delete(id, memberId, this.options)
    }

}
