import { LoggerBase } from '@crowd/logging'
import { IServiceOptions } from './IServiceOptions'
import MemberSegmentAffiliationRepository from '../database/repositories/memberSegmentAffiliationRepository'
import MemberRepository from '../database/repositories/memberRepository'
import MemberAffiliationRepository from '../database/repositories/memberAffiliationRepository'

export default class MemberAffiliationService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  async findAffiliation(memberId: string, timestamp: string): Promise<string> {
    const memberSegmentAffiliationRepository = new MemberSegmentAffiliationRepository(this.options)

    const manualAffiliation = await memberSegmentAffiliationRepository.findForMember(
      memberId,
      timestamp,
    )
    if (manualAffiliation) {
      return manualAffiliation.organizationId
    }

    const currentEmployment: any = await MemberRepository.findWorkExperience(
      memberId,
      timestamp,
      this.options,
    )
    if (currentEmployment) {
      return currentEmployment.organizationId
    }

    return null
  }

  async updateAffiliation(memberId: string) {
    await MemberAffiliationRepository.update(memberId, this.options)
  }
}
