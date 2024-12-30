/* eslint-disable no-continue */
import { Error404 } from '@crowd/common'
import { LoggerBase } from '@crowd/logging'
import { IMemberOrganization, IOrganization } from '@crowd/types'

import MemberOrganizationsRepository from '@/database/repositories/member/memberOrganizationsRepository'

import { IServiceOptions } from '../IServiceOptions'
import MemberAffiliationService from '../memberAffiliationService'

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
    const memberOrganizations = await MemberOrganizationsRepository.create(
      memberId,
      data,
      this.options,
    )
    await MemberAffiliationService.startAffiliationRecalculation(
      memberId,
      [data.organizationId],
      this.options,
    )
    return memberOrganizations
  }

  // Update member organization
  async update(
    id: string,
    memberId: string,
    data: Partial<IMemberOrganization>,
  ): Promise<IOrganization[]> {
    const memberOrganizations = await MemberOrganizationsRepository.update(
      id,
      memberId,
      data,
      this.options,
    )
    await MemberAffiliationService.startAffiliationRecalculation(
      memberId,
      [data.organizationId],
      this.options,
    )
    return memberOrganizations
  }

  // Delete member organization
  async delete(id: string, memberId: string): Promise<IOrganization[]> {
    const existingMemberOrganizations = await MemberOrganizationsRepository.list(
      memberId,
      this.options,
    )
    const memberOrganizationToBeDeleted = existingMemberOrganizations.find(
      (mo) => mo.memberOrganizations.id === id,
    )
    if (!memberOrganizationToBeDeleted) {
      throw new Error404(`Member organization with id ${id} not found!`)
    }

    const remainingMemberOrganizations = await MemberOrganizationsRepository.delete(
      id,
      memberId,
      this.options,
    )

    await MemberAffiliationService.startAffiliationRecalculation(
      memberId,
      [memberOrganizationToBeDeleted.memberOrganizations.organizationId],
      this.options,
    )

    return remainingMemberOrganizations
  }
}
