import { Context } from '@temporalio/activity'

import { ONBOARDING_AUTO_APPLY } from '@crowd/common'
import {
  deleteProjectCatalogPendingSlackBotOnboarding,
  finalizeProjectCatalogEvaluation,
  findProjectCatalogById,
  findProjectCatalogPendingEvaluation,
  findProjectCatalogPendingOnboarding,
  findProjectCatalogReviewWithoutMessage,
  finishPipelineRun,
  lockProjectCatalogReviewRequest,
  markProjectCatalogClassified,
  promoteProjectCatalogIdsToEvaluate,
  promoteProjectsToEvaluate,
  setProjectCatalogReviewMessageTs,
  startPipelineRun,
} from '@crowd/data-access-layer'
import { IPipelineRunFinish } from '@crowd/data-access-layer/src/project-catalog-pipeline-runs/types'
import {
  IDbProjectCatalog,
  isGithubDiscussionProvenance,
  isSlackBotProvenance,
} from '@crowd/data-access-layer/src/project-catalog/types'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getServiceLogger } from '@crowd/logging'
import {
  buildBotAutoApplyDisabledReply,
  buildBotReviewReply,
  buildBotSkippedReply,
  classifyCatalogRow,
  toReviewRequestCard,
} from '@crowd/project-onboarding'
import {
  loadBatchRepoLookups,
  withCatalogRowClassifierDeps,
} from '@crowd/project-onboarding/src/requestClassifierDeps'
import {
  SlackChannel,
  SlackPersona,
  postReviewRequest,
  replyInSlackThread,
  sendSlackNotificationAsync,
} from '@crowd/slack'
import { WorkflowIdReusePolicy } from '@crowd/temporal'
import { estimateLlmCostUsd } from '@crowd/types'

import { evaluateProject } from '../evaluator/evaluator'
import { svc } from '../main'
import {
  IClassifyAndRouteResult,
  IEvaluationActivityResult,
  IImmediateOnboardingPlan,
  IImmediateOnboardingRef,
  IImmediateOnboardingResult,
  IPriorityConfig,
} from '../types'
import { classifyAndRouteProjects } from './classifyAndRoute'
import { buildImmediateOnboardingPlan } from './immediateOnboarding'
import { buildSkippedDiscussionAlert } from './skippedRequestAlert'

const log = getServiceLogger()

/**
 * Promotes 'auto' projects to 'evaluate' up to the configured limit.
 * Count, slot computation, locking, and update are all done atomically
 * inside a single SQL statement — see promoteProjectsToEvaluate in the DAL.
 */
export async function promoteProjectsForEvaluation(config: IPriorityConfig): Promise<void> {
  const { evaluateLimit, sourcePriority } = config
  const qx = pgpQx(svc.postgres.writer.connection())

  log.info({ evaluateLimit, sourcePriority }, 'Priority promotion: starting.')

  const promoted = await promoteProjectsToEvaluate(qx, { evaluateLimit, sourcePriority })

  log.info({ promoted }, 'Priority promotion: complete.')
}

export async function promoteCatalogIdsForEvaluation(catalogIds: string[]): Promise<void> {
  const qx = pgpQx(svc.postgres.writer.connection())

  const promoted = await promoteProjectCatalogIdsToEvaluate(qx, catalogIds)

  log.info({ catalogIds, promoted }, 'Promoted the requested catalog rows to evaluate.')
}

export async function fetchPendingProjects(
  batchSize: number,
  catalogIds?: string[],
): Promise<IDbProjectCatalog[]> {
  // Requested ids were promoted on the writer moments ago; the replica may not have them yet.
  const pool = catalogIds ? svc.postgres.writer : svc.postgres.reader
  const qx = pgpQx(pool.connection())

  const projects = await findProjectCatalogPendingEvaluation(qx, {
    limit: catalogIds ? undefined : batchSize,
    ids: catalogIds,
  })

  log.info(
    { count: projects.length, batchSize, catalogIds },
    'Fetched projects pending evaluation.',
  )

  return projects
}

export async function classifyAndRoutePendingProjects(
  projects: IDbProjectCatalog[],
): Promise<IClassifyAndRouteResult> {
  // Writer connection: avoids replica lag missing a just-written repo/project mapping,
  // same reasoning as evaluateAndUpdateProject's fresh-state read below.
  const writeQx = pgpQx(svc.postgres.writer.connection())

  const repoLookups = await loadBatchRepoLookups(
    writeQx,
    projects.map((project) => project.repoUrl),
  )

  const result = await withCatalogRowClassifierDeps(
    writeQx,
    (deps) =>
      classifyAndRouteProjects(projects, {
        findFresh: (id) => findProjectCatalogById(writeQx, id),
        classify: async (row) => (await classifyCatalogRow(row, deps)).classification,
        markClassified: (id, classification) =>
          markProjectCatalogClassified(writeQx, id, classification),
        onRowStart: (project) =>
          Context.current().heartbeat({ stage: 'classification', id: project.id }),
      }),
    repoLookups,
  )

  log.info(
    {
      total: projects.length,
      routed: result.routed,
      breakdown: result.breakdown,
      discarded: result.discarded,
      remaining: result.remaining.length,
    },
    'Classification and routing complete.',
  )

  return result
}

export async function evaluateAndUpdateProject(
  project: IDbProjectCatalog,
): Promise<IEvaluationActivityResult | null> {
  const qx = pgpQx(svc.postgres.writer.connection())
  const startTime = Date.now()

  // Guard: fetch fresh state to ensure the API is called at most once per project.
  // Uses the writer connection to avoid replica lag missing a just-written evaluatedAt.
  const fresh = await findProjectCatalogById(qx, project.id)
  if (fresh?.evaluatedAt) {
    log.info(
      { id: project.id, repoUrl: project.repoUrl, evaluatedAt: fresh.evaluatedAt },
      'Project already evaluated, skipping API call.',
    )
    return null
  }

  log.info({ id: project.id, repoUrl: project.repoUrl }, 'Starting evaluation.')

  const result = await evaluateProject({
    id: project.id,
    repoUrl: project.repoUrl,
    repoName: project.repoName,
    projectSlug: project.projectSlug,
    lfCriticalityScore: project.lfCriticalityScore,
    source: project.source,
  })

  const updated = await finalizeProjectCatalogEvaluation(qx, project.id, {
    action: result.outcome,
    evaluationResult: result.evaluationResult,
    evaluationReason: result.evaluationReason,
  })

  const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1)

  if (!updated) {
    log.info(
      { id: project.id, repoUrl: project.repoUrl, elapsedSeconds },
      'Project was moved out of evaluate by a manual request while evaluating, discarding DB update.',
    )
  } else {
    log.info(
      {
        id: project.id,
        repoUrl: project.repoUrl,
        outcome: result.outcome,
        evaluationResult: result.evaluationResult,
        evaluationReason: result.evaluationReason,
        elapsedSeconds,
      },
      'Evaluation complete.',
    )
  }

  if (!result.metrics) {
    return {
      applied: Boolean(updated),
      outcome: result.outcome,
      evaluationReason: result.evaluationReason,
      model: null,
      inputTokens: null,
      outputTokens: null,
      costUsd: null,
      seconds: null,
    }
  }

  const { model, inputTokens, outputTokens, seconds } = result.metrics

  return {
    applied: Boolean(updated),
    outcome: result.outcome,
    evaluationReason: result.evaluationReason,
    model,
    inputTokens,
    outputTokens,
    costUsd: estimateLlmCostUsd(model, inputTokens, outputTokens),
    seconds,
  }
}

async function replyInBotThread(
  project: Pick<IDbProjectCatalog, 'id' | 'repoUrl' | 'sourceUrl'>,
  text: string,
  outcome: string,
): Promise<void> {
  const result = await replyInSlackThread(project.sourceUrl, text)

  if (!result.ok) {
    log.warn(
      {
        id: project.id,
        repoUrl: project.repoUrl,
        sourceUrl: project.sourceUrl,
        error: result.error,
      },
      `Slack bot thread reply (${outcome}) was not sent.`,
    )
  }
}

export async function notifySkippedHumanRequest(
  project: IDbProjectCatalog,
  reason: string,
): Promise<void> {
  if (isSlackBotProvenance(project.provenance)) {
    await replyInBotThread(project, buildBotSkippedReply(project, reason), 'skipped')
    return
  }

  if (!isGithubDiscussionProvenance(project.provenance)) {
    return
  }

  const sent = await sendSlackNotificationAsync(
    SlackChannel.CDP_PROJECT_CATALOG_SKIP_ALERTS,
    SlackPersona.WARNING_PROPAGATOR,
    `Skipped — ${project.repoName}`,
    buildSkippedDiscussionAlert(project, reason),
  )

  if (!sent) {
    log.warn(
      { id: project.id, repoUrl: project.repoUrl },
      'Skipped-discussion Slack alert was not sent.',
    )
  }
}

const REVIEW_REQUEST_LIMIT = 50

export async function fetchReviewRequests(catalogIds?: string[]): Promise<IDbProjectCatalog[]> {
  const qx = pgpQx(svc.postgres.writer.connection())

  const projects = await findProjectCatalogReviewWithoutMessage(qx, {
    limit: catalogIds ? undefined : REVIEW_REQUEST_LIMIT,
    ids: catalogIds,
  })

  log.info({ count: projects.length, catalogIds }, 'Fetched review rows without a Slack request.')

  return projects
}

export async function notifyReviewRequest(project: IDbProjectCatalog): Promise<void> {
  const qx = pgpQx(svc.postgres.writer.connection())

  const posted = await qx.tx(async (tx): Promise<boolean> => {
    const locked = await lockProjectCatalogReviewRequest(tx, project.id)
    if (!locked) {
      log.info(
        { id: project.id, repoUrl: project.repoUrl },
        'Review request already posted by another run or the row left review.',
      )
      return false
    }

    const result = await postReviewRequest(toReviewRequestCard(project))
    if (!result.ok || !result.ts) {
      log.warn(
        { id: project.id, repoUrl: project.repoUrl, error: result.error },
        'Review request Slack message was not sent.',
      )
      return false
    }

    await setProjectCatalogReviewMessageTs(tx, project.id, result.ts)
    log.info({ id: project.id, repoUrl: project.repoUrl, ts: result.ts }, 'Review request posted.')
    return true
  })

  if (posted && isSlackBotProvenance(project.provenance)) {
    await replyInBotThread(project, buildBotReviewReply(project), 'review')
  }
}

export async function notifyAutoApplyDisabled(row: IImmediateOnboardingRef): Promise<void> {
  await replyInBotThread(row, buildBotAutoApplyDisabledReply(row), 'auto-apply disabled')
}

async function startImmediateOnboarding(catalogIds: string[], workflowId: string): Promise<void> {
  try {
    await svc.temporal.workflow.start('onboardProjects', {
      taskQueue: 'automatic-onboarding',
      workflowId: `onboard-${workflowId}`,
      workflowIdReusePolicy: WorkflowIdReusePolicy.REJECT_DUPLICATE,
      args: [{ catalogIds }],
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'WorkflowExecutionAlreadyStartedError') {
      log.info({ workflowId, catalogIds }, 'Immediate onboarding already started.')
      return
    }
    throw err
  }
}

export async function planImmediateOnboarding(
  catalogIds: string[],
): Promise<IImmediateOnboardingPlan> {
  const qx = pgpQx(svc.postgres.writer.connection())

  const pendingOnboarding = await findProjectCatalogPendingOnboarding(qx, { ids: catalogIds })

  return buildImmediateOnboardingPlan(pendingOnboarding, ONBOARDING_AUTO_APPLY)
}

// Only this activity deletes pending bot rows, so a missing row means a retried attempt
// already removed it and its thread reply is still owed.
async function wasRemovedByEarlierAttempt(
  qx: ReturnType<typeof pgpQx>,
  id: string,
): Promise<boolean> {
  const current = await findProjectCatalogById(qx, id)
  return current === null
}

export async function applyImmediateOnboarding(
  plan: IImmediateOnboardingPlan,
  workflowId: string,
): Promise<IImmediateOnboardingResult> {
  const qx = pgpQx(svc.postgres.writer.connection())
  const removed: string[] = []

  for (const row of plan.toRemove) {
    const deleted = await deleteProjectCatalogPendingSlackBotOnboarding(qx, row.id)
    if (deleted === 0) {
      if (await wasRemovedByEarlierAttempt(qx, row.id)) {
        removed.push(row.repoUrl)
        continue
      }
      log.info(
        { id: row.id, repoUrl: row.repoUrl },
        'Row changed since the plan was made, leaving it alone.',
      )
      continue
    }
    removed.push(row.repoUrl)
    log.warn(
      { id: row.id, repoUrl: row.repoUrl },
      'Auto-onboarding is disabled, the package will not be onboarded. Removed the row from the project catalog.',
    )
  }

  if (plan.toOnboard.length === 0) {
    return { onboarding: [], removed }
  }

  await startImmediateOnboarding(
    plan.toOnboard.map((row) => row.id),
    workflowId,
  )
  const onboarding = plan.toOnboard.map((row) => row.repoUrl)
  log.info({ repoUrls: onboarding }, 'Immediate onboarding started for the slack bot request.')

  return { onboarding, removed }
}

export async function startEvaluationPipelineRun(
  workflowId: string | null,
  temporalRunId: string | null,
): Promise<string> {
  const qx = pgpQx(svc.postgres.writer.connection())

  const run = await startPipelineRun(qx, { stage: 'evaluation', workflowId, temporalRunId })

  return run.id
}

export async function finishEvaluationPipelineRun(
  id: string,
  data: IPipelineRunFinish,
): Promise<void> {
  const qx = pgpQx(svc.postgres.writer.connection())

  await finishPipelineRun(qx, id, data)
}
