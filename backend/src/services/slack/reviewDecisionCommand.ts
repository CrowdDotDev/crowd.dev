import { z } from 'zod'

import { resolveProjectCatalogReview } from '@crowd/data-access-layer'
import { ReviewDecision, buildReviewDecisionMessage } from '@crowd/slack'
import { WorkflowIdReusePolicy } from '@crowd/temporal'

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

  const qx = await getBgQx()
  const resolved = await resolveProjectCatalogReview(qx, catalogId, {
    decision,
    reviewedBy: actorId,
  })
  if (!resolved) {
    log.info({ catalogId, decision, actorId }, 'Review decision for a row no longer in review.')
    await replaceOriginal(
      responseUrl,
      textMessage('This request was already reviewed or is no longer pending review.'),
      log,
    )
    return
  }

  log.info({ catalogId, repoUrl: resolved.repoUrl, decision, actorId }, 'Review decision recorded.')

  const onboardingStarted =
    decision === 'approve' &&
    (await startApprovedOnboarding(temporal, catalogId, resolved.reviewedAt, log))

  await replaceOriginal(
    responseUrl,
    buildReviewDecisionMessage(resolved, decision, actorId, { onboardingStarted }),
    log,
  )
}
