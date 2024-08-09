/* eslint-disable no-continue */

import { LoggerBase } from '@crowd/logging'
import { IMemberOrganization, IOrganization } from '@crowd/types'
import { IServiceOptions } from '../IServiceOptions'
import MemberOrganizationsRepository from '@/database/repositories/member/memberOrganizationsRepository'

export default class MemberOrganizationsService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  // Member organization list
  async list(memberId: string): Promise<IOrganization[]> {
    return MemberOrganizationsRepository.list(memberId, this.options)
  }

  // Member organization creation
  async create(memberId: string, data: Partial<IMemberOrganization>): Promise<IOrganization[]> {
    return MemberOrganizationsRepository.create(memberId, data, this.options)
  }

  // Update member organization
  async update(
    id: string,
    memberId: string,
    data: Partial<IMemberOrganization>,
  ): Promise<IOrganization[]> {
    return MemberOrganizationsRepository.update(id, memberId, data, this.options)
  }

  // Delete member organization
  async delete(id: string, memberId: string): Promise<IOrganization[]> {
    return MemberOrganizationsRepository.delete(id, memberId, this.options)
  }
}
