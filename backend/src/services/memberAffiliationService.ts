import { LoggerBase } from '@crowd/logging'
import { IServiceOptions } from './IServiceOptions'
import MemberSegmentAffiliationRepository from '../database/repositories/memberSegmentAffiliationRepository'
import MemberRepository from '../database/repositories/memberRepository'

export default class MemberAffiliationService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  async findAffiliation(memberId: string): Promise<string> {
    const memberSegmentAffiliationRepository = new MemberSegmentAffiliationRepository(this.options)

    const manualAffiliation = await memberSegmentAffiliationRepository.findForMember(memberId)
    if (manualAffiliation) {
      return manualAffiliation.organizationId
    }

    const currentEmployment: any = await MemberRepository.findWorkExperience(memberId, this.options)
    if (currentEmployment) {
      return currentEmployment.organizationId
    }

    return null
  }
}
