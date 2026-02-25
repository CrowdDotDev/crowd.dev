import {
  changeMemberOrganizationAffiliationOverrides,
  findMemberAffiliationOverrides,
  findPrimaryWorkExperiencesOfMember,
} from '@crowd/data-access-layer/src/member_organization_affiliation_overrides'
import {
  IChangeAffiliationOverrideData,
  IMemberOrganizationAffiliationOverride,
} from '@crowd/types'

import { IRepositoryOptions } from '../IRepositoryOptions'
import SequelizeRepository from '../sequelizeRepository'

class MemberOrganizationAffiliationOverridesRepository {
  static async changeOverride(data: IChangeAffiliationOverrideData, options: IRepositoryOptions) {
    const qx = SequelizeRepository.getQueryExecutor(options)

    await changeMemberOrganizationAffiliationOverrides(qx, [data])
    const overrides = await findMemberAffiliationOverrides(qx, data.memberId, [
      data.memberOrganizationId,
    ])

    return overrides[0]
  }

  static async findPrimaryWorkExperiences(
    memberId: string,
    options: IRepositoryOptions,
  ): Promise<IMemberOrganizationAffiliationOverride[]> {
    const qx = SequelizeRepository.getQueryExecutor(options)
    return findPrimaryWorkExperiencesOfMember(qx, memberId)
  }
}

export default MemberOrganizationAffiliationOverridesRepository
