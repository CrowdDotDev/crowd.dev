import { LoggerBase } from '@crowd/logging'
import { TemporalWorkflowId } from '@crowd/types'
import { IServiceOptions } from './IServiceOptions'
import MemberSegmentAffiliationRepository from '../database/repositories/memberSegmentAffiliationRepository'
import MemberRepository from '../database/repositories/memberRepository'

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

    const mostRecentOrg: any = await MemberRepository.findMostRecentOrganization(
      memberId,
      timestamp,
      this.options,
    )
    if (mostRecentOrg) {
      return mostRecentOrg.organizationId
    }

    const mostRecentOrgEver: any = await MemberRepository.findMostRecentOrganizationEver(
      memberId,
      this.options,
    )
    if (mostRecentOrgEver) {
      return mostRecentOrgEver.organizationId
    }

    return null
  }

  async updateAffiliation(memberId: string) {
    await this.options.temporal.workflow.start('memberUpdate', {
      taskQueue: 'profiles',
      workflowId: `${TemporalWorkflowId.MEMBER_UPDATE}/${this.options.currentTenant.id}/${memberId}`,
      retry: {
        maximumAttempts: 10,
      },
      args: [
        {
          member: {
            id: memberId,
          },
        },
      ],
      searchAttributes: {
        TenantId: [this.options.currentTenant.id],
      },
    })
  }
}
