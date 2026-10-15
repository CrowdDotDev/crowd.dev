import {
  completeMemberContributorJob,
  failMemberContributorJob,
} from '@crowd/data-access-layer/src/osspckgs/memberContributorJobs'

import { getPackagesDb } from '../../db'
import { MemberContributorsJobRef } from './start'

export interface FailMemberContributorsJobInput extends MemberContributorsJobRef {
  reason: string
}

export async function completeMemberContributorsJob(
  input: MemberContributorsJobRef,
): Promise<void> {
  await completeMemberContributorJob(await getPackagesDb(), input.jobId)
}

export async function failMemberContributorsJob(
  input: FailMemberContributorsJobInput,
): Promise<void> {
  await failMemberContributorJob(await getPackagesDb(), input.jobId, input.reason)
}
