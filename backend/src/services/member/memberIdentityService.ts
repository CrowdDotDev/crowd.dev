/* eslint-disable no-continue */

import { LoggerBase } from '@crowd/logging'
import { IServiceOptions } from './IServiceOptions'
import {IMemberIdentity} from "@crowd/types";
import MemberRepository from "@/database/repositories/memberRepository";
import MemberIdentityRepository from "@/database/repositories/member/memberIdentityRepository";

export default class MemberIdentityService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

    async list(memberId: string, segmentId?: string): Promise<IMemberIdentity[]> {
        return MemberIdentityRepository.list(memberId, this.options, {
            segmentId,
        })
    }

    async create(memberId: string, data: any): Promise<IMemberIdentity[]> {
        return MemberIdentityRepository.create(data, this.options)
    }

    async update(id: string, memberId: string, data: any): Promise<IMemberIdentity[]> {
        return MemberIdentityRepository.update(id, memberId, data, this.options)
    }

    async delete(id: string, memberId: string): Promise<IMemberIdentity[]> {
        return MemberIdentityRepository.delete(id, memberId, this.options)
    }

}
