import axios from 'axios'
import { SearchSyncApiClient } from '@crowd/opensearch'
import { TemporalWorkflowId } from '@crowd/types'
import { chunkArray } from '@crowd/common'
import { WorkflowIdReusePolicy } from '@temporalio/workflow'
import { svc } from '../main'

export async function mergeMembers(
  primaryMemberId: string,
  secondaryMemberId: string,
  tenantId: string,
): Promise<void> {
  const url = `${process.env['CROWD_API_SERVICE_URL']}/tenant/${tenantId}/member/${primaryMemberId}/merge`
  const requestOptions = {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env['CROWD_API_SERVICE_USER_TOKEN']}`,
      'Content-Type': 'application/json',
    },
    data: {
      memberToMerge: secondaryMemberId,
    },
  }

  try {
    await axios(url, requestOptions)
  } catch (error) {
    console.log(`Failed merging member wit status [${error.response.status}]. Skipping!`)
  }
}

export async function syncMember(memberId: string): Promise<void> {
  const syncApi = new SearchSyncApiClient({
    baseUrl: process.env['CROWD_SEARCH_SYNC_API_URL'],
  })

  try {
    await syncApi.triggerMemberSync(memberId)
  } catch (error) {
    console.log(`Failed syncing member [${memberId}]!`)
    throw new Error(error)
  }
}

export async function syncActivities(activityIds: string[]): Promise<void> {
  const syncApi = new SearchSyncApiClient({
    baseUrl: process.env['CROWD_SEARCH_SYNC_API_URL'],
  })

  const chunks = chunkArray<string>(activityIds, 100)

  for (const chunk of chunks) {
    try {
      await syncApi.triggerActivitiesSync(chunk)
    } catch (error) {
      console.log(`Failed syncing activities !`)
      throw new Error(error)
    }
  }
}

export async function recalculateActivityAffiliationsOfMemberAsync(
  memberId: string,
  tenantId: string,
): Promise<void> {
  await svc.temporal.workflow.start('memberUpdate', {
    taskQueue: 'profiles',
    workflowId: `${TemporalWorkflowId.MEMBER_UPDATE}/${tenantId}/${memberId}`,
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
      TenantId: [tenantId],
    },
  })
}
