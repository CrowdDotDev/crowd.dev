import { IMemberUnmergeBackup, IUnmergeBackup, TemporalWorkflowId } from '@crowd/types'
import axios from 'axios'
import { SearchSyncApiClient } from '@crowd/opensearch'
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

export async function unmergeMembers(
  primaryMemberId: string,
  backup: IUnmergeBackup<IMemberUnmergeBackup>,
  tenantId: string,
): Promise<void> {
  const url = `${process.env['CROWD_API_SERVICE_URL']}/tenant/${tenantId}/member/${primaryMemberId}/unmerge`
  const requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env['CROWD_API_SERVICE_USER_TOKEN']}`,
      'Content-Type': 'application/json',
    },
    data: {
      ...backup,
    },
  }

  try {
    await axios(url, requestOptions)
  } catch (error) {
    console.log(`Failed unmerging member with status [${error.response.status}]. Skipping!`)
  }
}

export async function waitForTemporalWorkflowExecutionFinish(workflowId: string): Promise<void> {
  const handle = svc.temporal.workflow.getHandle(workflowId)

  const timeoutDuration = 1000 * 60 * 2 // 2 minutes

  try {
    // Wait for the workflow to complete or the timeout to occur
    await Promise.race([handle.result(), timeout(timeoutDuration, workflowId)])
  } catch (err) {
    console.error('Failed to get workflow result:', err.message)
  }
}

export function timeout(ms: number, workflowId: string): Promise<void> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Timeout waiting for workflow ${workflowId} to finish`))
    }, ms)
  })
}
