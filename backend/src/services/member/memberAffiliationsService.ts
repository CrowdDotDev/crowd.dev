/* eslint-disable no-continue */

import { LoggerBase } from '@crowd/logging'
import { IMemberAffiliation, IOrganization } from '@crowd/types'
import { IServiceOptions } from '../IServiceOptions'
import MemberAffiliationsRepository from '@/database/repositories/member/memberAffiliationsRepository'

export default class MemberAffiliationsService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  // Member affiliations list
  async list(memberId: string): Promise<IOrganization[]> {
    return MemberAffiliationsRepository.list(memberId, this.options)
  }

  // Member multiple identity creation
  async upsertMultiple(
    tenantId: string,
    memberId: string,
    data: Partial<IMemberAffiliation>[],
  ): Promise<IMemberAffiliation[]> {
    return MemberAffiliationsRepository.upsertMultiple(tenantId, memberId, data, this.options)
  }
}
