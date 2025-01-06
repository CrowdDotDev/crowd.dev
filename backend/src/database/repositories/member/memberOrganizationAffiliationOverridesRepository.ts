import {
    changeOverride as changeMemberOrganizationAffiliationOverride,
    findOverrides as findMemberOrganizationAffiliationOverrides,
  } from '@crowd/data-access-layer/src/member_organization_affiliation_overrides'
  import { IChangeAffiliationOverrideData } from '@crowd/types'
  
  import { IRepositoryOptions } from '../IRepositoryOptions'
  import SequelizeRepository from '../sequelizeRepository'
  

  class MemberOrganizationAffiliationOverridesRepository {
    static async changeOverride(
      data: IChangeAffiliationOverrideData,
      options: IRepositoryOptions,
    ) {
        const qx = SequelizeRepository.getQueryExecutor(options)
  
        await changeMemberOrganizationAffiliationOverride(qx, data)
        const overrides = await findMemberOrganizationAffiliationOverrides(qx, data.memberId, [data.organizationId])
        return overrides[0]
    }

  }
  
  export default MemberOrganizationAffiliationOverridesRepository
  