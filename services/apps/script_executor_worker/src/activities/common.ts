import {
  IMemberIdentity,
  IMemberUnmergeBackup,
  IMemberUnmergePreviewResult,
  IUnmergeBackup,
  IUnmergePreviewResult,
} from '@crowd/types'
import axios from 'axios'
import { svc } from '../main'
import { findOrganizationSegments } from '@crowd/data-access-layer/src/old/apps/entity_merging_worker'

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

export async function unmergeMembersPreview(
  tenantId: string,
  memberId: string,
  memberIdentity: IMemberIdentity,
): Promise<IUnmergePreviewResult<IMemberUnmergePreviewResult>> {
  const url = `${process.env['CROWD_API_SERVICE_URL']}/tenant/${tenantId}/member/${memberId}/unmerge/preview`
  const requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env['CROWD_API_SERVICE_USER_TOKEN']}`,
      'Content-Type': 'application/json',
    },
    data: {
      platform: memberIdentity.platform,
      value: memberIdentity.value,
      type: memberIdentity.type,
    },
  }

  try {
    const result = await axios(url, requestOptions)
    return result.data
  } catch (error) {
    console.log(`Failed unmerging member with status [${error.response.status}]. Skipping!`)
  }
}

export async function mergeOrganizations(
  tenantId: string,
  primaryOrgId: string,
  secondaryOrgId: string,
  segmentId?: string,
): Promise<void> {
  // if segmentId doesn't exist we can get just one segment org belongs to and use that
  if (!segmentId) {
    const result = await findOrganizationSegments(svc.postgres.writer, primaryOrgId)
    segmentId = result?.segmentIds?.[0] ?? undefined
  }

  const url = `${process.env['CROWD_API_SERVICE_URL']}/tenant/${tenantId}/organization/${primaryOrgId}/merge`
  const requestOptions = {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env['CROWD_API_SERVICE_USER_TOKEN']}`,
      'Content-Type': 'application/json',
    },
    data: {
      organizationToMerge: secondaryOrgId,
      segments: segmentId ? [segmentId] : [],
    },
  }

  try {
    await axios(url, requestOptions)
  } catch (error) {
    console.log(`Failed merging organization with status [${error.response.status}]. Skipping!`)
  }
}

export async function waitForTemporalWorkflowExecutionFinish(workflowId: string): Promise<void> {
  const handle = svc.temporal.workflow.getHandle(workflowId)

  const timeoutDuration = 1000 * 60 * 10 // 10 minutes

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
