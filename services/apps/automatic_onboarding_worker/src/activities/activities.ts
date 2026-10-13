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
import {
  IDbProjectCatalog,
  isSlackBotProvenance,
} from '@crowd/data-access-layer/src/project-catalog/types'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getServiceLogger } from '@crowd/logging'
import {
  buildBotErroredReply,
  buildBotOnboardedReply,
  buildBotSkippedReply,
  connectRepoToSegment,
  deriveProjectSlug,
  onboardProject,
} from '@crowd/project-onboarding'
import { createCdpSegmentLookup } from '@crowd/project-onboarding/src/cdpSegmentLookup'
import {
  SlackChannel,
  SlackPersona,
  replyInSlackThread,
  sendSlackNotificationAsync,
} from '@crowd/slack'

import { svc } from '../main'
import { OnboardAndUpdateProjectOutcome } from '../types'
import {
  buildErroredDiscussionAlert,
  buildOnboardedDiscussionAlert,
  buildOnboardedDiscussionTitle,
  groupGithubDiscussionRequestsBySource,
  isGithubDiscussionRequest,
} from './discussionRequestAlert'
import { buildInsightsProjectSkipReason } from './insightsProjectSkip'
import { runProposedActionSerialized } from './proposedAction'

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
    return 'already-skipped'
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
  // atomically before the external call lets exactly one proceed; dead claims expire in the DAL.
  const claimed = await claimProjectCatalogForOnboarding(qx, project.id)
  if (!claimed) {
    return resolveUnclaimedOutcome(qx, project)
  }

  log.info(
    { id: project.id, repoUrl: project.repoUrl, proposedAction: project.proposedAction },
    'Starting onboarding.',
  )

  const result = await runProposedActionSerialized(project, qx, (depsQx) => ({
    findCdpSegmentByPccProject: createCdpSegmentLookup(depsQx),
    onboardProject,
    connectRepoToSegment,
  })).catch(async (err) => {
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

export async function notifyOnboardedHumanRequests(projects: IDbProjectCatalog[]): Promise<void> {
  for (const project of projects.filter((row) => isSlackBotProvenance(row.provenance))) {
    await replyInBotThread(project, buildBotOnboardedReply(project), 'onboarded')
  }

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

export async function notifySkippedBotRequest(project: IDbProjectCatalog): Promise<void> {
  if (!isSlackBotProvenance(project.provenance)) {
    return
  }

  const qx = pgpQx(svc.postgres.writer.connection())
  const current = await findProjectCatalogById(qx, project.id)
  if (current?.action !== 'skip') {
    log.info(
      { id: project.id, repoUrl: project.repoUrl, action: current?.action },
      'Row is no longer skipped, not replying in the Slack thread.',
    )
    return
  }

  const reason = current.skipReason ?? '(no reason recorded)'
  await replyInBotThread(project, buildBotSkippedReply(project, reason), 'skipped')
}

export async function notifyErroredHumanRequest(
  project: IDbProjectCatalog,
  reason: string,
): Promise<void> {
  if (isSlackBotProvenance(project.provenance)) {
    await replyInBotThread(project, buildBotErroredReply(project, reason), 'error')
    return
  }

  if (!isGithubDiscussionRequest(project)) {
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
