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
  findLatestMemberContributorJobStatusByPurl,
  findMemberContributorsPackage,
} from '@crowd/data-access-layer'
import type { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import {
  type Client,
  WorkflowExecutionAlreadyStartedError,
  WorkflowIdConflictPolicy,
  WorkflowIdReusePolicy,
} from '@crowd/temporal'

import { collectionPathForPurlType, purlType } from './memberContributorCollectionPaths'
import {
  MEMBER_CONTRIBUTORS_JOB_TASK_QUEUE,
  MEMBER_CONTRIBUTORS_JOB_WORKFLOW,
  memberContributorsJobWorkflowId,
  toPendingMemberContributorsJob,
} from './memberContributorsJob'
import { purlBodySchema } from './purl'

type LinkedPackage = MemberContributorsPackageRow & { repoId: string }

function resolveCollectionPath(purl: string): {
  purlType: string
  collectionPath: MemberContributorCollectionPath
} {
  const type = purlType(purl)
  const collectionPath = collectionPathForPurlType(type)
  if (collectionPath === null) {
    throw new BadRequestError(`Unsupported ecosystem: ${type}`)
  }
  return { purlType: type, collectionPath }
}

async function findLinkedPackage(qx: QueryExecutor, purl: string): Promise<LinkedPackage> {
  const pkg = await findMemberContributorsPackage(qx, purl)
  if (!pkg) {
    throw new NotFoundError()
  }
  if (pkg.repoId === null) {
    throw new NotFoundError('Purl has no linked repository')
  }
  return { ...pkg, repoId: pkg.repoId }
}

async function assertCollectable(
  qx: QueryExecutor,
  pkg: LinkedPackage,
  purl: string,
): Promise<void> {
  if (!pkg.hasContributorRows) {
    return
  }
  const latestStatus = await findLatestMemberContributorJobStatusByPurl(qx, purl)
  if (latestStatus !== 'failed') {
    throw new ConflictError('Member contributors already collected for this purl')
  }
}

async function findActiveJobIdOrThrow(qx: QueryExecutor, purl: string): Promise<string> {
  const active = await findActiveMemberContributorJobByPurl(qx, purl)
  if (!active) {
    throw new ConflictError('Member contributors job insert raced and no active job was found')
  }
  return active.id
}

function jobWorkflowStartOptions(jobId: string) {
  return {
    taskQueue: MEMBER_CONTRIBUTORS_JOB_TASK_QUEUE,
    workflowId: memberContributorsJobWorkflowId(jobId),
    retry: { maximumAttempts: 1 },
    args: [{ jobId }],
  }
}

async function ensureJobWorkflowStarted(jobId: string): Promise<void> {
  const packagesTemporal = await getPackagesTemporalClient()
  try {
    await packagesTemporal.workflow.start(MEMBER_CONTRIBUTORS_JOB_WORKFLOW, {
      ...jobWorkflowStartOptions(jobId),
      workflowIdConflictPolicy: WorkflowIdConflictPolicy.USE_EXISTING,
      workflowIdReusePolicy: WorkflowIdReusePolicy.REJECT_DUPLICATE,
    })
  } catch (err) {
    if (!(err instanceof WorkflowExecutionAlreadyStartedError)) {
      throw err
    }
  }
}

async function workflowExists(packagesTemporal: Client, jobId: string): Promise<boolean> {
  try {
    await packagesTemporal.workflow.getHandle(memberContributorsJobWorkflowId(jobId)).describe()
    return true
  } catch {
    return false
  }
}

async function startJobWorkflow(qx: QueryExecutor, jobId: string): Promise<void> {
  let packagesTemporal: Client | undefined
  try {
    packagesTemporal = await getPackagesTemporalClient()
    await packagesTemporal.workflow.start(
      MEMBER_CONTRIBUTORS_JOB_WORKFLOW,
      jobWorkflowStartOptions(jobId),
    )
  } catch (err) {
    if (packagesTemporal && (await workflowExists(packagesTemporal, jobId))) {
      return
    }
    const message = err instanceof Error ? err.message : String(err)
    await failMemberContributorJob(qx, jobId, message)
    throw err
  }
}

export async function submitMemberContributorsJob(req: Request, res: Response): Promise<void> {
  const { purl } = validateOrThrow(purlBodySchema, req.body)
  const { collectionPath } = resolveCollectionPath(purl)

  const qx = await getPackagesQx()
  const pkg = await findLinkedPackage(qx, purl)

  const active = await findActiveMemberContributorJobByPurl(qx, purl)
  if (active) {
    await ensureJobWorkflowStarted(active.id)
    res.status(202).json(toPendingMemberContributorsJob(active.id))
    return
  }

  await assertCollectable(qx, pkg, purl)

  const created = await createMemberContributorJob(qx, {
    id: generateUUIDv4(),
    purl,
    ecosystem: pkg.ecosystem,
    collectionPath,
    packageId: pkg.packageId,
    repoId: pkg.repoId,
  })
  if (created === null) {
    const activeJobId = await findActiveJobIdOrThrow(qx, purl)
    await ensureJobWorkflowStarted(activeJobId)
    res.status(202).json(toPendingMemberContributorsJob(activeJobId))
    return
  }

  await startJobWorkflow(qx, created)
  res.status(202).json(toPendingMemberContributorsJob(created))
}
