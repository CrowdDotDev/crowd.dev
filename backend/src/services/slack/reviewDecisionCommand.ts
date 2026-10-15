import { z } from 'zod'

import { findProjectCatalogById, resolveProjectCatalogReview } from '@crowd/data-access-layer'
import {
  IDbProjectCatalog,
  isSlackBotProvenance,
} from '@crowd/data-access-layer/src/project-catalog/types'
import type { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import {
  NO_REVIEW_CARD_EXTRAS,
  applyRequestStatus,
  buildBotDoneReply,
  buildBotRejectedReply,
  resolveReviewCdpUrl,
  toReviewRequestCard,
} from '@crowd/project-onboarding'
import {
  ReviewDecision,
  buildReviewDecisionMessage,
  buildReviewRequestBlocks,
  buildReviewRequestText,
  getSlackBotConfig,
  replyInSlackThread,
} from '@crowd/slack'
import { WorkflowIdReusePolicy } from '@crowd/temporal'

import { API_CONFIG } from '../../conf'
import { IServiceOptions } from '../IServiceOptions'
import type { OnboardingRequestTemporal } from './onboardingRequestBot'
import { ResponseUrlMessage, postToResponseUrl, textMessage } from './onboardProjectCommand'
import { getBgQx } from './slackBackground'

const catalogIdSchema = z.string().uuid()

export interface IReviewDecisionCommand {
  catalogId: string
  decision: ReviewDecision
  responseUrl: string
  actorId: string
  temporal: OnboardingRequestTemporal | null
  log: IServiceOptions['log']
}

function replaceOriginal(
  responseUrl: string,
  message: ResponseUrlMessage,
  log: IServiceOptions['log'],
) {
  const replaced = { ...message, replace_original: true }
  return postToResponseUrl(responseUrl, replaced, log)
}

function isAllowedReviewer(actorId: string, log: IServiceOptions['log']): boolean {
  const { reviewerUserIds } = getSlackBotConfig()
  if (reviewerUserIds.length === 0) {
    log.warn('CROWD_SLACK_REVIEWER_USER_IDS is not set, every review decision is refused.')
    return false
  }
  return reviewerUserIds.includes(actorId)
}

function postEphemeral(responseUrl: string, text: string, log: IServiceOptions['log']) {
  const ephemeral = { ...textMessage(text), response_type: 'ephemeral', replace_original: false }
  return postToResponseUrl(responseUrl, ephemeral, log)
}

export function postReviewDecisionFailure(responseUrl: string, log: IServiceOptions['log']) {
  return postToResponseUrl(
    responseUrl,
    textMessage(':no_entry: Recording the review decision failed. Please try again.'),
    log,
  )
}

function reviewCycleWorkflowId(catalogId: string, reviewedAt: string | null): string {
  const cycle = reviewedAt ? Date.parse(reviewedAt) : Date.now()
  return `onboard-review-${catalogId}-${cycle}`
}

async function startApprovedOnboarding(
  temporal: OnboardingRequestTemporal | null,
  catalogId: string,
  reviewedAt: string | null,
  log: IServiceOptions['log'],
): Promise<boolean> {
  if (!temporal) {
    log.warn({ catalogId }, 'Temporal not configured, the approved row waits for the schedule.')
    return false
  }

  try {
    await temporal.workflow.start('onboardProjects', {
      taskQueue: 'automatic-onboarding',
      workflowId: reviewCycleWorkflowId(catalogId, reviewedAt),
      workflowIdReusePolicy: WorkflowIdReusePolicy.REJECT_DUPLICATE,
      args: [{ catalogIds: [catalogId] }],
    })
    return true
  } catch (err) {
    if (err instanceof Error && err.name === 'WorkflowExecutionAlreadyStartedError') {
      return true
    }
    log.error(
      { catalogId, err },
      'Starting the approved onboarding failed, the row waits for the schedule.',
    )
    return false
  }
}

export async function runReviewDecisionCommand({
  catalogId: rawCatalogId,
  decision,
  responseUrl,
  actorId,
  temporal,
  log,
}: IReviewDecisionCommand): Promise<void> {
  const parsedId = catalogIdSchema.safeParse(rawCatalogId)
  if (!parsedId.success) {
    log.warn({ rawCatalogId }, 'Review decision click carried an invalid catalog id.')
    await replaceOriginal(
      responseUrl,
      textMessage(':no_entry: This request is no longer valid.'),
      log,
    )
    return
  }
  const catalogId = parsedId.data

  if (!isAllowedReviewer(actorId, log)) {
    log.info({ catalogId, decision, actorId }, 'Review decision click from a non-reviewer ignored.')
    await postEphemeral(
      responseUrl,
      'Only the CDP team can approve, reject or mark requests as done. If you need this one moved along, ask in this thread.',
      log,
    )
    return
  }

  const qx = await getBgQx()
  const resolved = await resolveProjectCatalogReview(qx, catalogId, {
    decision,
    reviewedBy: actorId,
  })
  if (!resolved) {
    await handleRefusedDecision(qx, catalogId, decision, responseUrl, actorId, log)
    return
  }

  log.info({ catalogId, repoUrl: resolved.repoUrl, decision, actorId }, 'Review decision recorded.')

  const onboardingStarted =
    decision === 'approve' &&
    (await startApprovedOnboarding(temporal, catalogId, resolved.reviewedAt, log))

  await replaceOriginal(
    responseUrl,
    buildReviewDecisionMessage(
      toReviewRequestCard(resolved, NO_REVIEW_CARD_EXTRAS),
      decision,
      actorId,
      {
        onboardingStarted,
      },
    ),
    log,
  )

  if (decision === 'reject') {
    await replyInBotThread(qx, resolved, buildBotRejectedReply(resolved), 'notAdded', log)
  } else if (decision === 'done') {
    await replyInBotThread(qx, resolved, buildBotDoneReply(resolved), 'added', log)
  } else if (isSlackBotProvenance(resolved.provenance)) {
    await applyRequestStatus(qx, resolved, 'checking')
  }
}

const REFUSED_DECISION_NOTICES: Record<ReviewDecision, string> = {
  approve:
    'This request needs a person: add the repo by hand in CDP, then use Mark as done. The buttons were refreshed.',
  done: "This repo is added automatically, so it can't be marked as done. The buttons were refreshed.",
  reject: 'This request could not be rejected. The buttons were refreshed, please try again.',
}

async function handleRefusedDecision(
  qx: QueryExecutor,
  catalogId: string,
  decision: ReviewDecision,
  responseUrl: string,
  actorId: string,
  log: IServiceOptions['log'],
): Promise<void> {
  const row = await findProjectCatalogById(qx, catalogId)
  if (!row || row.action !== 'review') {
    log.info({ catalogId, decision, actorId }, 'Review decision for a row no longer in review.')
    await replaceOriginal(
      responseUrl,
      textMessage('This request was already reviewed or is no longer pending review.'),
      log,
    )
    return
  }

  log.info({ catalogId, decision, actorId }, 'Review decision refused, the card was refreshed.')
  const card = toReviewRequestCard(row, {
    cdpUrl: await resolveReviewCdpUrl(qx, row, API_CONFIG.frontendUrl),
    repoContext: null,
  })
  await replaceOriginal(
    responseUrl,
    { text: buildReviewRequestText(card), blocks: buildReviewRequestBlocks(card) },
    log,
  )
  await postEphemeral(responseUrl, REFUSED_DECISION_NOTICES[decision], log)
}

async function replyInBotThread(
  qx: QueryExecutor,
  row: IDbProjectCatalog,
  text: string,
  status: 'notAdded' | 'added',
  log: IServiceOptions['log'],
): Promise<void> {
  if (!isSlackBotProvenance(row.provenance)) {
    return
  }

  const result = await replyInSlackThread(row.sourceUrl, text)
  if (!result.ok) {
    log.warn(
      { catalogId: row.id, sourceUrl: row.sourceUrl, error: result.error },
      'Review outcome reply in the Slack bot thread was not sent.',
    )
  }
  await applyRequestStatus(qx, row, status)
}
