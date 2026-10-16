import type { Request, Response } from 'express'
import { z } from 'zod'

import { getPackagesQx } from '@/db/packagesDb'
import { ok } from '@/utils/api'
import { validateOrThrow } from '@/utils/validation'
import { InternalError, NotFoundError } from '@crowd/common'
import {
  AkritesExternalMemberContributors,
  MemberContributorJobRow,
  findAffiliatedMemberIdentities,
  findMemberContributorJob,
  findMemberContributorsPackage,
  groupAffiliatedMemberIdentities,
  toAkritesExternalMemberContributors,
} from '@crowd/data-access-layer'
import type { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'

import {
  AkritesExternalMemberContributorsJob,
  toDoneMemberContributorsJob,
  toFailedMemberContributorsJob,
  toPendingMemberContributorsJob,
} from './memberContributorsJob'

const paramsSchema = z.object({ jobId: z.uuid() })

async function readCollectedBody(
  qx: QueryExecutor,
  purl: string,
): Promise<AkritesExternalMemberContributors> {
  const pkg = await findMemberContributorsPackage(qx, purl)
  if (!pkg || pkg.repoId === null || pkg.repoUrl === null) {
    throw new InternalError(`Done member contributors job has no linked package for ${purl}`)
  }
  const { repoId, repoUrl } = pkg
  const rows = await findAffiliatedMemberIdentities(qx, { packageId: pkg.packageId, repoId })
  return toAkritesExternalMemberContributors(
    { ...pkg, repoUrl },
    groupAffiliatedMemberIdentities(rows),
  )
}

async function toJobResponse(
  qx: QueryExecutor,
  job: MemberContributorJobRow,
): Promise<AkritesExternalMemberContributorsJob> {
  switch (job.status) {
    case 'done':
      return toDoneMemberContributorsJob(job.id, await readCollectedBody(qx, job.purl))
    case 'failed':
      return toFailedMemberContributorsJob(job.id, job.error)
    default:
      return toPendingMemberContributorsJob(job.id)
  }
}

export async function getMemberContributorsJob(req: Request, res: Response): Promise<void> {
  const { jobId } = validateOrThrow(paramsSchema, req.params)
  const qx = await getPackagesQx()
  const job = await findMemberContributorJob(qx, jobId)
  if (!job) {
    throw new NotFoundError()
  }
  ok(res, await toJobResponse(qx, job))
}
