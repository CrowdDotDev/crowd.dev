import { LoggerBase } from '@crowd/logging'
import { WorkflowIdReusePolicy } from '@crowd/temporal'
import { TemporalWorkflowId } from '@crowd/types'

import MemberRepository from '../database/repositories/memberRepository'
import MemberSegmentAffiliationRepository from '../database/repositories/memberSegmentAffiliationRepository'

import { IServiceOptions } from './IServiceOptions'

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

  static async startAffiliationRecalculation(
    memberId: string,
    organizationIds: string[],
    options: IServiceOptions,
    syncToOpensearch = false,
  ): Promise<void> {
    await options.temporal.workflow.start('memberUpdate', {
      taskQueue: 'profiles',
      workflowId: `${TemporalWorkflowId.MEMBER_UPDATE}/${options.currentTenant.id}/${memberId}`,
      workflowIdReusePolicy: WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_TERMINATE_IF_RUNNING,
      retry: {
        maximumAttempts: 10,
      },
      args: [
        {
          member: {
            id: memberId,
          },
          memberOrganizationIds: organizationIds,
          syncToOpensearch,
        },
      ],
      searchAttributes: {
        TenantId: [options.currentTenant.id],
      },
    })
  }
}
