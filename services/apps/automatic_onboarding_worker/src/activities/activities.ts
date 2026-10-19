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
  BotStatus,
  NO_REVIEW_CARD_EXTRAS,
  applyRequestStatus,
  buildBotErroredReply,
  buildBotOnboardedContent,
  buildBotSkippedReply,
  connectRepoToSegment,
  deriveProjectSlug,
  findOnboardedInsightsProject,
  findOrganizationSiblings,
  onboardProject,
  organizationOf,
  organizationReviewOf,
  reportRequestOutcome,
  toReviewRequestCard,
} from '@crowd/project-onboarding'
import { createCdpSegmentLookup } from '@crowd/project-onboarding/src/cdpSegmentLookup'
import {
  ISlackMessageContent,
  SlackChannel,
  SlackPersona,
  buildReviewClosedMessage,
  getSlackBotConfig,
  parseSlackPermalink,
  sendSlackNotificationAsync,
  updateSlackMessage,
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
    const reason = buildInsightsProjectSkipReason(deletedInsightsProject.deletedAt)
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
    matchedSegmentId: result.segmentId ?? project.matchedSegmentId,
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
  content: string | ISlackMessageContent,
  status: BotStatus,
): Promise<void> {
  const result = await reportRequestOutcome(
    pgpQx(svc.postgres.writer.connection()),
    project,
    content,
  )

  if (!result.ok) {
    log.warn(
      {
        id: project.id,
        repoUrl: project.repoUrl,
        sourceUrl: project.sourceUrl,
        error: result.error,
      },
      `Slack bot thread reply (${status}) was not sent.`,
    )
  }

  await applyRequestStatus(pgpQx(svc.postgres.writer.connection()), project, status)
}

function skippedStatus(project: Pick<IDbProjectCatalog, 'classificationKind'>): BotStatus {
  return project.classificationKind === 'already_tracked' ? 'alreadyThere' : 'notAdded'
}

function reviewCardChannel(project: Pick<IDbProjectCatalog, 'sourceUrl'>): string | null {
  const origin = project.sourceUrl ? parseSlackPermalink(project.sourceUrl) : null
  return origin?.channel ?? getSlackBotConfig().reviewChannelId ?? null
}

async function closeReviewCard(
  project: IDbProjectCatalog,
  projectName: string,
  closedCards: Set<string>,
): Promise<void> {
  const channel = reviewCardChannel(project)
  if (!project.reviewMessageTs || !channel || closedCards.has(project.reviewMessageTs)) {
    return
  }

  const siblings = await findOrganizationSiblings(
    pgpQx(svc.postgres.writer.connection()),
    project,
    (row) => row.reviewMessageTs === project.reviewMessageTs,
  )
  const members = [project, ...siblings]
  const pending = members.filter((row) => row.action === 'onboard')
  if (pending.length > 0) {
    log.info(
      { id: project.id, ts: project.reviewMessageTs, pending: pending.length },
      'Organization card stays open while repositories are still being onboarded.',
    )
    return
  }

  const organization = organizationReviewOf(project, siblings.length)
  const onboarded = members.filter((row) => row.action === 'onboarded').length
  const card = toReviewRequestCard(project, NO_REVIEW_CARD_EXTRAS, organization)
  const closed = buildReviewClosedMessage(card, {
    projectName,
    reviewedBy: project.reviewedBy,
    reviewedAt: project.reviewedAt,
    repositories: organization ? { onboarded, total: members.length } : undefined,
  })
  const result = await updateSlackMessage({ channel, ts: project.reviewMessageTs, ...closed })
  if (!result.ok) {
    log.warn(
      { id: project.id, repoUrl: project.repoUrl, channel, error: result.error },
      'Review card was not updated after the onboarding.',
    )
    return
  }
  closedCards.add(project.reviewMessageTs)
}

async function notifyOnboardedRequest(
  stale: IDbProjectCatalog,
  closedCards: Set<string>,
): Promise<void> {
  const qx = pgpQx(svc.postgres.writer.connection())
  const project = (await findProjectCatalogById(qx, stale.id)) ?? stale
  const insightsProject = await findOnboardedInsightsProject(qx, project).catch((err) => {
    log.warn({ id: project.id, repoUrl: project.repoUrl, err }, 'Insights project lookup failed.')
    return null
  })

  if (isSlackBotProvenance(project.provenance)) {
    await replyInBotThread(project, buildBotOnboardedContent(project, insightsProject), 'added')
  }
  if (insightsProject) {
    await closeReviewCard(project, insightsProject.name, closedCards)
  }
}

export async function notifyOnboardedHumanRequests(projects: IDbProjectCatalog[]): Promise<void> {
  const closedCards = new Set<string>()
  for (const project of projects) {
    await notifyOnboardedRequest(project, closedCards)
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
  await replyInBotThread(project, buildBotSkippedReply(project, reason), skippedStatus(current))
  await closeOrganizationCardIfSettled(current)
}

// The last repository of an organization to fail or be skipped must still close the shared card.
async function closeOrganizationCardIfSettled(stale: IDbProjectCatalog): Promise<void> {
  if (!organizationOf(stale) || !stale.reviewMessageTs) {
    return
  }
  const qx = pgpQx(svc.postgres.writer.connection())
  const project = (await findProjectCatalogById(qx, stale.id)) ?? stale
  const projectName = project.matchedProjectName ?? project.projectName ?? 'the project'
  await closeReviewCard(project, projectName, new Set())
}

export async function notifyErroredHumanRequest(
  project: IDbProjectCatalog,
  reason: string,
): Promise<void> {
  if (isSlackBotProvenance(project.provenance)) {
    await replyInBotThread(project, buildBotErroredReply(project), 'problem')
    await closeOrganizationCardIfSettled(project)
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
