import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./verifySignature', () => ({ verifySlackSignature: vi.fn(() => true) }))
vi.mock('@/services/slack/forceOnboardingCommand', () => ({
  runForceOnboardingCommand: vi.fn(async () => undefined),
  replaceWithForceOnboardingFailure: vi.fn(async () => undefined),
}))
vi.mock('@/services/slack/answerRequestCommand', () => ({
  runAnswerRequestCommand: vi.fn(async () => undefined),
  postAnswerRequestFailure: vi.fn(async () => undefined),
}))
vi.mock('@/services/slack/retryEvaluationCommand', () => ({
  runRetryEvaluationCommand: vi.fn(async () => undefined),
  postRetryEvaluationFailure: vi.fn(async () => undefined),
}))
vi.mock('@/services/slack/reviewDecisionCommand', () => ({
  runReviewDecisionCommand: vi.fn(async () => undefined),
  runReviewRejectPrompt: vi.fn(async () => undefined),
  postReviewDecisionFailure: vi.fn(async () => undefined),
}))

import { runAnswerRequestCommand } from '@/services/slack/answerRequestCommand'
import {
  replaceWithForceOnboardingFailure,
  runForceOnboardingCommand,
} from '@/services/slack/forceOnboardingCommand'
import { runRetryEvaluationCommand } from '@/services/slack/retryEvaluationCommand'
import {
  postReviewDecisionFailure,
  runReviewDecisionCommand,
  runReviewRejectPrompt,
} from '@/services/slack/reviewDecisionCommand'

import { createInteractivityHandler } from './interactivity'
import { verifySlackSignature } from './verifySignature'

const temporal = { workflow: { start: vi.fn() } } as any
const interactivity = createInteractivityHandler(temporal)

function call(payload: object) {
  const req = {
    body: { payload: JSON.stringify(payload) },
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  } as any
  const res = { sendStatus: vi.fn() } as any
  return interactivity(req, res).then(() => ({ req, res }))
}

const forcePayload = {
  type: 'block_actions',
  user: { id: 'U123' },
  response_url: 'https://hooks.slack.com/response',
  actions: [{ action_id: 'force_onboarding', value: 'catalog-1' }],
}

const approvePayload = {
  ...forcePayload,
  trigger_id: 'trigger-1',
  actions: [{ action_id: 'approve_review', value: 'catalog-2' }],
}

const rejectSubmission = {
  type: 'view_submission',
  user: { id: 'U123' },
  view: {
    callback_id: 'reject_review_modal',
    private_metadata: JSON.stringify({
      catalogId: 'catalog-2',
      repoName: 'kops',
      responseUrl: 'https://hooks.slack.com/response',
    }),
    state: {
      values: {
        reason: { decision_reason: { selected_option: { value: 'wrong_project' } } },
        note: { decision_note: { value: 'Belongs to another project.' } },
      },
    },
  },
}

describe('interactivity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(verifySlackSignature).mockReturnValue(true)
  })

  it('acks and runs the force onboarding flow with the clicker as actor', async () => {
    const { res } = await call(forcePayload)

    expect(res.sendStatus).toHaveBeenCalledWith(200)
    expect(runForceOnboardingCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        catalogId: 'catalog-1',
        responseUrl: 'https://hooks.slack.com/response',
        actorId: 'U123',
      }),
    )
  })

  it('replaces the original message when the background flow rejects', async () => {
    vi.mocked(runForceOnboardingCommand).mockRejectedValueOnce(new Error('db down'))

    const { req } = await call(forcePayload)
    await new Promise((resolve) => setImmediate(resolve))

    expect(req.log.error).toHaveBeenCalled()
    expect(replaceWithForceOnboardingFailure).toHaveBeenCalledWith(
      'https://hooks.slack.com/response',
      req.log,
    )
  })

  it.each([
    ['approve_review', 'approve'],
    ['mark_done_review', 'done'],
  ])('runs the review decision for %s', async (actionId, decision) => {
    const { res } = await call({
      ...approvePayload,
      actions: [{ action_id: actionId, value: 'catalog-2' }],
    })

    expect(res.sendStatus).toHaveBeenCalledWith(200)
    expect(runReviewDecisionCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        catalogId: 'catalog-2',
        decision,
        responseUrl: 'https://hooks.slack.com/response',
        actorId: 'U123',
        triggerId: 'trigger-1',
        temporal,
      }),
    )
    expect(runForceOnboardingCommand).not.toHaveBeenCalled()
  })

  it('records the answer behind a question button click', async () => {
    const { res } = await call({
      ...forcePayload,
      actions: [{ action_id: 'answer_request:1', value: 'catalog-9|no' }],
    })

    expect(res.sendStatus).toHaveBeenCalledWith(200)
    expect(runAnswerRequestCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 'catalog-9|no',
        responseUrl: 'https://hooks.slack.com/response',
        actorId: 'U123',
        temporal,
      }),
    )
    expect(runReviewDecisionCommand).not.toHaveBeenCalled()
  })

  it('re-runs the evaluation for the row behind a Try again click', async () => {
    const { res } = await call({
      ...forcePayload,
      actions: [{ action_id: 'retry_evaluation', value: 'catalog-9' }],
    })

    expect(res.sendStatus).toHaveBeenCalledWith(200)
    expect(runRetryEvaluationCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        catalogId: 'catalog-9',
        responseUrl: 'https://hooks.slack.com/response',
        actorId: 'U123',
        temporal,
      }),
    )
    expect(runReviewDecisionCommand).not.toHaveBeenCalled()
  })

  it('opens the reject prompt instead of deciding on a reject click', async () => {
    const { res } = await call({
      ...approvePayload,
      actions: [{ action_id: 'reject_review', value: 'catalog-2' }],
    })

    expect(res.sendStatus).toHaveBeenCalledWith(200)
    expect(runReviewRejectPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        catalogId: 'catalog-2',
        responseUrl: 'https://hooks.slack.com/response',
        actorId: 'U123',
        triggerId: 'trigger-1',
      }),
    )
    expect(runReviewDecisionCommand).not.toHaveBeenCalled()
  })

  it('records the rejection with its reason when the modal is submitted', async () => {
    const { req, res } = await call(rejectSubmission)

    expect(res.sendStatus).toHaveBeenCalledWith(200)
    expect(runReviewDecisionCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        catalogId: 'catalog-2',
        decision: 'reject',
        reason: { decisionReason: 'wrong_project', decisionNote: 'Belongs to another project.' },
        responseUrl: 'https://hooks.slack.com/response',
        actorId: 'U123',
        temporal,
      }),
    )
    expect(req.log.warn).not.toHaveBeenCalled()
  })

  it('warns on a view submission it does not know', async () => {
    const { req } = await call({
      ...rejectSubmission,
      view: { ...rejectSubmission.view, callback_id: 'other_modal' },
    })

    expect(runReviewDecisionCommand).not.toHaveBeenCalled()
    expect(req.log.warn).toHaveBeenCalledWith('Unhandled Slack view submission.')
  })

  it('replaces the review message when the decision flow rejects', async () => {
    vi.mocked(runReviewDecisionCommand).mockRejectedValueOnce(new Error('db down'))

    const { req } = await call(approvePayload)
    await new Promise((resolve) => setImmediate(resolve))

    expect(postReviewDecisionFailure).toHaveBeenCalledWith(
      'https://hooks.slack.com/response',
      req.log,
    )
  })

  it('ignores a review click without a user', async () => {
    const { req } = await call({ ...approvePayload, user: undefined })

    expect(runReviewDecisionCommand).not.toHaveBeenCalled()
    expect(req.log.warn).toHaveBeenCalledWith('Unhandled Slack block action.')
  })

  it.each(['view_insights_project:0', 'open_in_cdp'])(
    'ignores a click on the link-only button %s without warning',
    async (actionId) => {
      const { req, res } = await call({ ...forcePayload, actions: [{ action_id: actionId }] })

      expect(res.sendStatus).toHaveBeenCalledWith(200)
      expect(req.log.warn).not.toHaveBeenCalled()
      expect(runReviewDecisionCommand).not.toHaveBeenCalled()
    },
  )

  it('still warns for an action that only resembles the link button id', async () => {
    const { req } = await call({
      ...forcePayload,
      actions: [{ action_id: 'view_insights_project_settings' }],
    })

    expect(req.log.warn).toHaveBeenCalledWith('Unhandled Slack block action.')
  })

  it('ignores unknown actions', async () => {
    const { res } = await call({ ...forcePayload, actions: [{ action_id: 'other' }] })

    expect(res.sendStatus).toHaveBeenCalledWith(200)
    expect(runForceOnboardingCommand).not.toHaveBeenCalled()
    expect(runReviewDecisionCommand).not.toHaveBeenCalled()
  })

  it('does nothing for an unverified request', async () => {
    vi.mocked(verifySlackSignature).mockReturnValue(false)

    const { res } = await call(forcePayload)

    expect(res.sendStatus).toHaveBeenCalledWith(200)
    expect(runForceOnboardingCommand).not.toHaveBeenCalled()
  })
})
