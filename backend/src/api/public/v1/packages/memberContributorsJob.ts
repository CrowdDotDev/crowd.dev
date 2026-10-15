import { TemporalWorkflowId } from '@crowd/types'

import type { AkritesExternalMemberContributors } from './akritesExternalMemberContributors'

export const MEMBER_CONTRIBUTORS_JOB_TASK_QUEUE = 'security-contacts-worker'
export const MEMBER_CONTRIBUTORS_JOB_WORKFLOW = 'collectMemberContributors'

export interface AkritesExternalMemberContributorsJobPending {
  jobId: string
  status: 'pending'
}

export interface AkritesExternalMemberContributorsJobFailed {
  jobId: string
  status: 'failed'
  reason: string
}

export type AkritesExternalMemberContributorsJobDone = Omit<
  AkritesExternalMemberContributors,
  'status'
> & {
  jobId: string
  status: 'done'
}

export type AkritesExternalMemberContributorsJob =
  | AkritesExternalMemberContributorsJobPending
  | AkritesExternalMemberContributorsJobFailed
  | AkritesExternalMemberContributorsJobDone

export function memberContributorsJobWorkflowId(jobId: string): string {
  return `${TemporalWorkflowId.MEMBER_CONTRIBUTORS_JOB}/${jobId}`
}

export function toPendingMemberContributorsJob(
  jobId: string,
): AkritesExternalMemberContributorsJobPending {
  return { jobId, status: 'pending' }
}

export function toFailedMemberContributorsJob(
  jobId: string,
  reason: string | null,
): AkritesExternalMemberContributorsJobFailed {
  return { jobId, status: 'failed', reason: reason ?? 'Job failed' }
}

export function toDoneMemberContributorsJob(
  jobId: string,
  body: AkritesExternalMemberContributors,
): AkritesExternalMemberContributorsJobDone {
  return { ...body, jobId, status: 'done' }
}
