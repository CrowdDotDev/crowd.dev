import {
  claimProjectCatalogForOnboarding,
  findProjectCatalogById,
  findProjectCatalogPendingOnboarding,
  finishPipelineRun,
  markProjectCatalogOnboardingFailed,
  markProjectCatalogOnboardingSkipped,
  releaseProjectCatalogOnboardingClaim,
  startPipelineRun,
  updateProjectCatalog,
} from '@crowd/data-access-layer'
import {
  InsightsProjectField,
  findInsightsProjectBySlugIncludingDeleted,
} from '@crowd/data-access-layer/src/collections'
import { IPipelineRunFinish } from '@crowd/data-access-layer/src/project-catalog-pipeline-runs/types'
import { IDbProjectCatalog } from '@crowd/data-access-layer/src/project-catalog/types'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getServiceLogger } from '@crowd/logging'
import { deriveProjectSlug, onboardProject } from '@crowd/project-onboarding'
import { SlackChannel, SlackPersona, sendSlackNotificationAsync } from '@crowd/slack'

import { svc } from '../main'
import { OnboardAndUpdateProjectOutcome } from '../types'
import {
  buildErroredDiscussionAlert,
  buildOnboardedDiscussionAlert,
  buildOnboardedDiscussionTitle,
  groupGithubDiscussionRequestsBySource,
  isReviewAlertRequest,
} from './discussionRequestAlert'
import { buildInsightsProjectSkipReason } from './insightsProjectSkip'

const log = getServiceLogger()

export async function fetchProjectsPendingOnboarding(
  batchSize: number,
  catalogIds?: string[],
): Promise<IDbProjectCatalog[]> {
  // Requested ids were routed to onboard on the writer moments ago; the replica may not have them yet.
  const pool = catalogIds ? svc.postgres.writer : svc.postgres.reader
  const qx = pgpQx(pool.connection())

  const projects = await findProjectCatalogPendingOnboarding(qx, {
    limit: catalogIds ? undefined : batchSize,
    ids: catalogIds,
  })

  log.info(
    { count: projects.length, batchSize, catalogIds },
    'Fetched projects pending onboarding.',
  )

  return projects
}

async function resolveUnclaimedOutcome(
  qx: ReturnType<typeof pgpQx>,
  project: IDbProjectCatalog,
): Promise<OnboardAndUpdateProjectOutcome> {
  const current = await findProjectCatalogById(qx, project.id)
  if (current?.onboardedAt) {
    log.info(
      { id: project.id, repoUrl: project.repoUrl, onboardedAt: current.onboardedAt },
      'Project already onboarded or claimed by another run, skipping API call.',
    )
    return 'already-onboarded'
  }
  if (current?.action === 'skip') {
    log.info({ id: project.id, repoUrl: project.repoUrl }, 'Project already skipped.')
    return 'skipped'
  }
  log.info(
    { id: project.id, repoUrl: project.repoUrl, action: current?.action },
    'Project catalog row changed concurrently, not calling onboarding API.',
  )
  return 'catalog-changed'
}

async function findDeletedInsightsProjectBySlug(qx: ReturnType<typeof pgpQx>, projectSlug: string) {
  const slug = deriveProjectSlug(projectSlug)
  const insightsProject = await findInsightsProjectBySlugIncludingDeleted(qx, slug, [
    InsightsProjectField.DELETED_AT,
  ])
  return insightsProject?.deletedAt ? insightsProject : null
}

export async function onboardAndUpdateProject(
  project: IDbProjectCatalog,
): Promise<OnboardAndUpdateProjectOutcome> {
  const qx = pgpQx(svc.postgres.writer.connection())
  const startTime = Date.now()

  const deletedInsightsProject = await findDeletedInsightsProjectBySlug(qx, project.projectSlug)
  if (deletedInsightsProject) {
    const reason = buildInsightsProjectSkipReason(
      project.projectSlug,
      deletedInsightsProject.deletedAt,
    )
    const updatedRows = await markProjectCatalogOnboardingSkipped(qx, project.id, reason)
    if (updatedRows > 0) {
      log.info({ id: project.id, repoUrl: project.repoUrl, reason }, 'Onboarding skipped.')
      return 'skipped'
    }

    return resolveUnclaimedOutcome(qx, project)
  }

  // The scheduled run and a bot-started run can hold the same row: stamping onboardedAt
  // atomically before the external call lets exactly one of them proceed.
  const claimed = await claimProjectCatalogForOnboarding(qx, project.id)
  if (!claimed) {
    return resolveUnclaimedOutcome(qx, project)
  }

  log.info({ id: project.id, repoUrl: project.repoUrl }, 'Starting onboarding.')

  const result = await onboardProject({
    id: project.id,
    repoUrl: project.repoUrl,
    repoName: project.repoName,
    projectSlug: project.projectSlug,
  }).catch(async (err) => {
    await releaseProjectCatalogOnboardingClaim(qx, project.id)
    throw err
  })

  if (result.outcome === 'error') {
    await releaseProjectCatalogOnboardingClaim(qx, project.id)
    throw new Error(result.error ?? 'Unknown onboarding error')
  }

  await updateProjectCatalog(qx, project.id, {
    action: 'onboarded',
    onboardedAt: new Date().toISOString(),
    onboardingError: null,
  })

  const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1)

  log.info(
    { id: project.id, repoUrl: project.repoUrl, segmentId: result.segmentId, elapsedSeconds },
    'Onboarding complete.',
  )

  return 'onboarded'
}

export async function notifyOnboardedHumanRequests(projects: IDbProjectCatalog[]): Promise<void> {
  for (const group of groupGithubDiscussionRequestsBySource(projects)) {
    const sent = await sendSlackNotificationAsync(
      SlackChannel.CDP_PROJECT_CATALOG_SKIP_ALERTS,
      SlackPersona.SUCCESS_ANNOUNCER,
      buildOnboardedDiscussionTitle(group),
      buildOnboardedDiscussionAlert(group),
    )

    if (!sent) {
      log.warn(
        { ids: group.map((project) => project.id), sourceUrl: group[0].sourceUrl },
        'Onboarded-discussion Slack alert was not sent.',
      )
    }
  }
}

export async function markProjectOnboardingFailed(
  projectId: string,
  reason: string,
): Promise<boolean> {
  const qx = pgpQx(svc.postgres.writer.connection())

  const updatedRows = await markProjectCatalogOnboardingFailed(qx, projectId, reason)

  if (updatedRows === 0) {
    log.info(
      { id: projectId },
      'Project was already onboarded or no longer pending, not marking as error.',
    )
    return false
  }

  log.error({ id: projectId, reason }, 'Onboarding permanently failed, marked as error.')
  return true
}

export async function notifyErroredHumanRequest(
  project: IDbProjectCatalog,
  reason: string,
): Promise<void> {
  if (!isReviewAlertRequest(project)) {
    return
  }

  const sent = await sendSlackNotificationAsync(
    SlackChannel.CDP_PROJECT_CATALOG_SKIP_ALERTS,
    SlackPersona.ERROR_REPORTER,
    `Onboarding failed — ${project.repoName}`,
    buildErroredDiscussionAlert(project, reason),
  )

  if (!sent) {
    log.warn(
      { id: project.id, repoUrl: project.repoUrl },
      'Errored-discussion Slack alert was not sent.',
    )
  }
}

export async function startOnboardingPipelineRun(
  workflowId: string | null,
  temporalRunId: string | null,
): Promise<string> {
  const qx = pgpQx(svc.postgres.writer.connection())

  const run = await startPipelineRun(qx, { stage: 'onboarding', workflowId, temporalRunId })

  return run.id
}

export async function finishOnboardingPipelineRun(
  id: string,
  data: IPipelineRunFinish,
): Promise<void> {
  const qx = pgpQx(svc.postgres.writer.connection())

  await finishPipelineRun(qx, id, data)
}
