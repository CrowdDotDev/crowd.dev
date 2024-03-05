import { WorkflowIdReusePolicy } from '@temporalio/workflow'
import { TemporalWorkflowId } from '../../../../../libs/types/src'
import { svc } from '../../main'
import { findMemberIdsInOrganization } from '@crowd/data-access-layer/src/old/apps/profiles_worker/orgs'
import { IOrganizationAffiliationUpdateInput } from '../../types/organization'

/*
updateMemberAffiliations is a Temporal activity that updates all affiliations for
members in an organization.
*/
export async function updateOrganizationAffiliations(
  input: IOrganizationAffiliationUpdateInput,
): Promise<void> {
  try {
    const memberIds = await findMemberIdsInOrganization(svc.postgres.writer, input.organization.id)
    for (const memberId of memberIds) {
      await svc.temporal.workflow.execute('memberUpdate', {
        taskQueue: 'profiles',
        workflowId: `${TemporalWorkflowId.MEMBER_UPDATE}/${input.tenantId}/${memberId}`,
        workflowIdReusePolicy: WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_TERMINATE_IF_RUNNING,
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
          TenantId: [input.tenantId],
        },
      })
    }
  } catch (err) {
    throw new Error(err)
  }
}
