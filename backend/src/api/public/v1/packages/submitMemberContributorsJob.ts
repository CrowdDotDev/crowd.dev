import type { Request, Response } from 'express'

import { getPackagesQx } from '@/db/packagesDb'
import { getPackagesTemporalClient } from '@/db/packagesTemporal'
import { validateOrThrow } from '@/utils/validation'
import { BadRequestError, ConflictError, NotFoundError, generateUUIDv4 } from '@crowd/common'
import {
  MemberContributorCollectionPath,
  MemberContributorsPackageRow,
  createMemberContributorJob,
  failMemberContributorJob,
  findActiveMemberContributorJobByPurl,
  findMemberContributorsPackage,
} from '@crowd/data-access-layer'
import type { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'

import { collectionPathForEcosystem, purlEcosystem } from './memberContributorCollectionPaths'
import {
  MEMBER_CONTRIBUTORS_JOB_TASK_QUEUE,
  MEMBER_CONTRIBUTORS_JOB_WORKFLOW,
  memberContributorsJobWorkflowId,
  toPendingMemberContributorsJob,
} from './memberContributorsJob'
import { purlBodySchema } from './purl'

type CollectablePackage = MemberContributorsPackageRow & { repoId: string }

function resolveCollectionPath(purl: string): {
  ecosystem: string
  collectionPath: MemberContributorCollectionPath
} {
  const ecosystem = purlEcosystem(purl)
  const collectionPath = collectionPathForEcosystem(ecosystem)
  if (collectionPath === null) {
    throw new BadRequestError(`Unsupported ecosystem: ${ecosystem}`)
  }
  return { ecosystem, collectionPath }
}

async function findCollectablePackage(
  qx: QueryExecutor,
  purl: string,
): Promise<CollectablePackage> {
  const pkg = await findMemberContributorsPackage(qx, purl)
  if (!pkg) {
    throw new NotFoundError()
  }
  if (pkg.repoId === null) {
    throw new NotFoundError('Purl has no linked repository')
  }
  if (pkg.hasContributorRows) {
    throw new ConflictError('Member contributors already collected for this purl')
  }
  return { ...pkg, repoId: pkg.repoId }
}

async function findActiveJobIdOrThrow(qx: QueryExecutor, purl: string): Promise<string> {
  const active = await findActiveMemberContributorJobByPurl(qx, purl)
  if (!active) {
    throw new ConflictError('Member contributors job insert raced and no active job was found')
  }
  return active.id
}

async function startJobWorkflow(qx: QueryExecutor, jobId: string): Promise<void> {
  try {
    const packagesTemporal = await getPackagesTemporalClient()
    await packagesTemporal.workflow.start(MEMBER_CONTRIBUTORS_JOB_WORKFLOW, {
      taskQueue: MEMBER_CONTRIBUTORS_JOB_TASK_QUEUE,
      workflowId: memberContributorsJobWorkflowId(jobId),
      retry: { maximumAttempts: 1 },
      args: [{ jobId }],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await failMemberContributorJob(qx, jobId, message)
    throw err
  }
}

export async function submitMemberContributorsJob(req: Request, res: Response): Promise<void> {
  const { purl } = validateOrThrow(purlBodySchema, req.body)
  const { ecosystem, collectionPath } = resolveCollectionPath(purl)

  const qx = await getPackagesQx()
  const pkg = await findCollectablePackage(qx, purl)

  const active = await findActiveMemberContributorJobByPurl(qx, purl)
  if (active) {
    res.status(202).json(toPendingMemberContributorsJob(active.id))
    return
  }

  const created = await createMemberContributorJob(qx, {
    id: generateUUIDv4(),
    purl,
    ecosystem,
    collectionPath,
    packageId: pkg.packageId,
    repoId: pkg.repoId,
  })
  if (created === null) {
    res.status(202).json(toPendingMemberContributorsJob(await findActiveJobIdOrThrow(qx, purl)))
    return
  }

  await startJobWorkflow(qx, created)
  res.status(202).json(toPendingMemberContributorsJob(created))
}
