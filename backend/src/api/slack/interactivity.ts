import type { Request, Response } from 'express'
import { z } from 'zod'

import {
  replaceWithForceOnboardingFailure,
  runForceOnboardingCommand,
} from '@/services/slack/forceOnboardingCommand'
import type { OnboardingRequestTemporal } from '@/services/slack/onboardingRequestBot'
import {
  replaceWithReviewDecisionFailure,
  runReviewDecisionCommand,
} from '@/services/slack/reviewDecisionCommand'
import {
  APPROVE_REVIEW_ACTION_ID,
  FORCE_ONBOARDING_ACTION_ID,
  REJECT_REVIEW_ACTION_ID,
} from '@/services/slack/slackActionIds'
import { validateOrThrow } from '@/utils/validation'

import { verifySlackSignature } from './verifySignature'

const bodySchema = z.object({
  payload: z.string(),
})

const payloadSchema = z.object({
  type: z.string(),
  user: z.object({ id: z.string() }).optional(),
  response_url: z.string().optional(),
  actions: z.array(z.object({ action_id: z.string(), value: z.string().optional() })).optional(),
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
  const approve = findActionClick(payload, APPROVE_REVIEW_ACTION_ID)
  const click = approve ?? findActionClick(payload, REJECT_REVIEW_ACTION_ID)
  if (!click) {
    return false
  }

  runReviewDecisionCommand({
    catalogId: click.value,
    decision: approve ? 'approve' : 'reject',
    responseUrl: click.responseUrl,
    actorId: click.actorId,
    temporal,
    log: req.log,
  }).catch((err) => {
    req.log.error(err, 'Review decision failed unexpectedly!')
    replaceWithReviewDecisionFailure(click.responseUrl, req.log)
  })
  return true
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
        { type: payload.type, actionIds: payload.actions?.map((a) => a.action_id) },
        'Received Slack interactivity payload.',
      )

      res.sendStatus(200)

      if (
        payload.type === 'block_actions' &&
        !dispatchForceOnboarding(payload, req) &&
        !dispatchReviewDecision(payload, req, temporal)
      ) {
        req.log.warn('Unhandled Slack block action.')
      }
    } catch (err) {
      req.log.error(err, 'Error processing Slack interactivity payload!')
      res.sendStatus(200)
    }
  }
}
