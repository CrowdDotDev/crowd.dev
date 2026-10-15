import type { Request, Response } from 'express'
import { z } from 'zod'

import {
  postAnswerRequestFailure,
  runAnswerRequestCommand,
} from '@/services/slack/answerRequestCommand'
import {
  replaceWithForceOnboardingFailure,
  runForceOnboardingCommand,
} from '@/services/slack/forceOnboardingCommand'
import type { OnboardingRequestTemporal } from '@/services/slack/onboardingRequestBot'
import {
  postRetryEvaluationFailure,
  runRetryEvaluationCommand,
} from '@/services/slack/retryEvaluationCommand'
import {
  postReviewDecisionFailure,
  runReviewDecisionCommand,
  runReviewRejectPrompt,
} from '@/services/slack/reviewDecisionCommand'
import {
  ANSWER_REQUEST_ACTION_ID,
  APPROVE_REVIEW_ACTION_ID,
  FORCE_ONBOARDING_ACTION_ID,
  MARK_DONE_REVIEW_ACTION_ID,
  OPEN_IN_CDP_ACTION_ID,
  REJECT_REVIEW_ACTION_ID,
  RETRY_EVALUATION_ACTION_ID,
  VIEW_INSIGHTS_PROJECT_ACTION_ID,
} from '@/services/slack/slackActionIds'
import { validateOrThrow } from '@/utils/validation'
import { type ReviewDecision, parseRejectReviewSubmission } from '@crowd/slack'

import { verifySlackSignature } from './verifySignature'

const bodySchema = z.object({
  payload: z.string(),
})

const submittedValueSchema = z.object({
  selected_option: z.object({ value: z.string().optional() }).nullish(),
  value: z.string().nullish(),
})

const payloadSchema = z.object({
  type: z.string(),
  user: z.object({ id: z.string() }).optional(),
  response_url: z.string().optional(),
  trigger_id: z.string().optional(),
  actions: z.array(z.object({ action_id: z.string(), value: z.string().optional() })).optional(),
  view: z
    .object({
      callback_id: z.string().optional(),
      private_metadata: z.string().optional(),
      state: z
        .object({
          values: z.record(z.string(), z.record(z.string(), submittedValueSchema)).optional(),
        })
        .optional(),
    })
    .optional(),
})

type InteractivityPayload = z.infer<typeof payloadSchema>

interface IActionClick {
  value: string
  responseUrl: string
  actorId: string
}

function findActionClick(payload: InteractivityPayload, actionId: string): IActionClick | null {
  const action = payload.actions?.find((a) => a.action_id === actionId)
  if (!action || !payload.user || !payload.response_url || !action.value) {
    return null
  }

  return { value: action.value, responseUrl: payload.response_url, actorId: payload.user.id }
}

const LINK_ONLY_ACTION_ID = new RegExp(
  `^(${VIEW_INSIGHTS_PROJECT_ACTION_ID}:\\d+|${OPEN_IN_CDP_ACTION_ID})$`,
)

const REVIEW_DECISION_ACTIONS: [string, ReviewDecision][] = [
  [APPROVE_REVIEW_ACTION_ID, 'approve'],
  [MARK_DONE_REVIEW_ACTION_ID, 'done'],
]

function findReviewDecisionClick(
  payload: InteractivityPayload,
): { click: IActionClick; decision: ReviewDecision } | null {
  for (const [actionId, decision] of REVIEW_DECISION_ACTIONS) {
    const click = findActionClick(payload, actionId)
    if (click) {
      return { click, decision }
    }
  }
  return null
}

function isLinkOnlyClick(payload: InteractivityPayload): boolean {
  const actions = payload.actions ?? []
  return actions.length > 0 && actions.every((action) => LINK_ONLY_ACTION_ID.test(action.action_id))
}

function dispatchForceOnboarding(payload: InteractivityPayload, req: Request) {
  const click = findActionClick(payload, FORCE_ONBOARDING_ACTION_ID)
  if (!click) {
    return false
  }

  runForceOnboardingCommand({
    catalogId: click.value,
    responseUrl: click.responseUrl,
    actorId: click.actorId,
    log: req.log,
  }).catch((err) => {
    req.log.error(err, 'Force onboarding failed unexpectedly!')
    replaceWithForceOnboardingFailure(click.responseUrl, req.log)
  })
  return true
}

function dispatchReviewDecision(
  payload: InteractivityPayload,
  req: Request,
  temporal: OnboardingRequestTemporal | null,
) {
  const found = findReviewDecisionClick(payload)
  if (!found) {
    return false
  }
  const { click, decision } = found

  runReviewDecisionCommand({
    catalogId: click.value,
    decision,
    responseUrl: click.responseUrl,
    actorId: click.actorId,
    triggerId: payload.trigger_id ?? null,
    temporal,
    log: req.log,
  }).catch((err) => {
    req.log.error(err, 'Review decision failed unexpectedly!')
    postReviewDecisionFailure(click.responseUrl, req.log)
  })
  return true
}

const ANSWER_ACTION_ID = new RegExp(`^${ANSWER_REQUEST_ACTION_ID}:\\d+$`)

function dispatchAnswerRequest(
  payload: InteractivityPayload,
  req: Request,
  temporal: OnboardingRequestTemporal | null,
) {
  const action = payload.actions?.find((candidate) => ANSWER_ACTION_ID.test(candidate.action_id))
  if (!action?.value || !payload.user || !payload.response_url) {
    return false
  }
  const click = { value: action.value, responseUrl: payload.response_url, actorId: payload.user.id }

  runAnswerRequestCommand({ ...click, temporal, log: req.log }).catch((err) => {
    req.log.error(err, 'Answering the request question failed unexpectedly!')
    postAnswerRequestFailure(click.responseUrl, req.log)
  })
  return true
}

function dispatchRetryEvaluation(
  payload: InteractivityPayload,
  req: Request,
  temporal: OnboardingRequestTemporal | null,
) {
  const click = findActionClick(payload, RETRY_EVALUATION_ACTION_ID)
  if (!click) {
    return false
  }

  runRetryEvaluationCommand({
    catalogId: click.value,
    responseUrl: click.responseUrl,
    actorId: click.actorId,
    temporal,
    log: req.log,
  }).catch((err) => {
    req.log.error(err, 'Retrying the evaluation failed unexpectedly!')
    postRetryEvaluationFailure(click.responseUrl, req.log)
  })
  return true
}

function dispatchRejectPrompt(payload: InteractivityPayload, req: Request) {
  const click = findActionClick(payload, REJECT_REVIEW_ACTION_ID)
  if (!click) {
    return false
  }

  runReviewRejectPrompt({
    catalogId: click.value,
    responseUrl: click.responseUrl,
    actorId: click.actorId,
    triggerId: payload.trigger_id ?? null,
    log: req.log,
  }).catch((err) => {
    req.log.error(err, 'Opening the reject prompt failed unexpectedly!')
    postReviewDecisionFailure(click.responseUrl, req.log)
  })
  return true
}

function dispatchRejectSubmission(
  payload: InteractivityPayload,
  req: Request,
  temporal: OnboardingRequestTemporal | null,
) {
  const submission = payload.view ? parseRejectReviewSubmission(payload.view) : null
  if (!submission || !payload.user) {
    return false
  }

  runReviewDecisionCommand({
    catalogId: submission.catalogId,
    decision: 'reject',
    reason: { decisionReason: submission.reason, decisionNote: submission.note },
    responseUrl: submission.responseUrl,
    actorId: payload.user.id,
    triggerId: null,
    temporal,
    log: req.log,
  }).catch((err) => {
    req.log.error(err, 'Review rejection failed unexpectedly!')
    postReviewDecisionFailure(submission.responseUrl, req.log)
  })
  return true
}

// A modal submission must be answered with an empty body or a response_action, or Slack keeps
// the modal open with a connection error; a plain 200 is only right for block actions.
function acknowledge(payload: InteractivityPayload, res: Response): void {
  if (payload.type === 'view_submission') {
    res.status(200).json({ response_action: 'clear' })
    return
  }
  res.sendStatus(200)
}

// Mounted ahead of responseHandlerMiddleware, so errors are handled here
// directly instead of via the global errorMiddleware.
export function createInteractivityHandler(temporal: OnboardingRequestTemporal | null) {
  return async (req: Request, res: Response) => {
    if (!verifySlackSignature(req)) {
      req.log.warn('Received unverified Slack interactivity payload!')
      res.sendStatus(200)
      return
    }

    try {
      const { payload: rawPayload } = validateOrThrow(bodySchema, req.body)
      const payload = validateOrThrow(payloadSchema, JSON.parse(rawPayload))

      req.log.info(
        {
          type: payload.type,
          actionIds: payload.actions?.map((a) => a.action_id),
          callbackId: payload.view?.callback_id,
        },
        'Received Slack interactivity payload.',
      )

      acknowledge(payload, res)

      if (
        payload.type === 'block_actions' &&
        !isLinkOnlyClick(payload) &&
        !dispatchForceOnboarding(payload, req) &&
        !dispatchRetryEvaluation(payload, req, temporal) &&
        !dispatchAnswerRequest(payload, req, temporal) &&
        !dispatchRejectPrompt(payload, req) &&
        !dispatchReviewDecision(payload, req, temporal)
      ) {
        req.log.warn('Unhandled Slack block action.')
      }

      if (payload.type === 'view_submission' && !dispatchRejectSubmission(payload, req, temporal)) {
        req.log.warn('Unhandled Slack view submission.')
      }
    } catch (err) {
      req.log.error(err, 'Error processing Slack interactivity payload!')
      res.sendStatus(200)
    }
  }
}
