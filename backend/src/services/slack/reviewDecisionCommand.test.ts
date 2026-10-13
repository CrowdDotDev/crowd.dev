import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WorkflowIdReusePolicy } from '@crowd/temporal'

vi.mock('@crowd/data-access-layer', () => ({
  resolveProjectCatalogReview: vi.fn(),
}))
vi.mock('./onboardProjectCommand', () => ({
  postToResponseUrl: vi.fn(async () => undefined),
  textMessage: vi.fn((text: string) => ({ text })),
}))
vi.mock('./slackBackground', () => ({ getBgQx: vi.fn(async () => ({})) }))

import { resolveProjectCatalogReview } from '@crowd/data-access-layer'

import { postToResponseUrl } from './onboardProjectCommand'
import { postReviewDecisionFailure, runReviewDecisionCommand } from './reviewDecisionCommand'

const CATALOG_ID = '8f1c2a44-5b7e-4d2f-9c1a-3e6f7a8b9c0d'
const RESPONSE_URL = 'https://hooks.slack.com/response'

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as any
const startWorkflow = vi.fn(async () => undefined)
const temporal = { workflow: { start: startWorkflow } } as never

const reviewedRow = {
  id: CATALOG_ID,
  repoName: 'kops',
  repoUrl: 'https://github.com/kubernetes/kops',
  projectName: 'Kubernetes',
  classificationKind: 'lf_in_cdp',
  proposedAction: 'update_integration',
  sourceUrl: null,
  reviewedAt: '2026-10-13T07:00:00.000Z',
} as any

function run(overrides: Record<string, unknown> = {}) {
  return runReviewDecisionCommand({
    catalogId: CATALOG_ID,
    decision: 'approve',
    responseUrl: RESPONSE_URL,
    actorId: 'U123',
    temporal,
    log,
    ...overrides,
  })
}

function replacedMessage() {
  return vi.mocked(postToResponseUrl).mock.calls[0][1]
}

describe('runReviewDecisionCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveProjectCatalogReview).mockResolvedValue(reviewedRow)
  })

  it('approves the row, starts its onboarding right away and replaces the card', async () => {
    await run()

    expect(resolveProjectCatalogReview).toHaveBeenCalledWith(expect.anything(), CATALOG_ID, {
      decision: 'approve',
      reviewedBy: 'U123',
    })
    expect(startWorkflow).toHaveBeenCalledWith('onboardProjects', {
      taskQueue: 'automatic-onboarding',
      workflowId: `onboard-review-${CATALOG_ID}-${Date.parse('2026-10-13T07:00:00.000Z')}`,
      workflowIdReusePolicy: WorkflowIdReusePolicy.REJECT_DUPLICATE,
      args: [{ catalogIds: [CATALOG_ID] }],
    })
    expect(replacedMessage()).toMatchObject({ text: 'Approved — kops', replace_original: true })
    expect(JSON.stringify(replacedMessage())).toContain('onboarding started.')
  })

  it('rejects the row without starting any workflow', async () => {
    await run({ decision: 'reject' })

    expect(resolveProjectCatalogReview).toHaveBeenCalledWith(expect.anything(), CATALOG_ID, {
      decision: 'reject',
      reviewedBy: 'U123',
    })
    expect(startWorkflow).not.toHaveBeenCalled()
    expect(replacedMessage()).toMatchObject({ text: 'Rejected — kops', replace_original: true })
  })

  it('starts a new workflow for a later review cycle of the same row', async () => {
    vi.mocked(resolveProjectCatalogReview).mockResolvedValue({
      ...reviewedRow,
      reviewedAt: '2026-10-14T07:00:00.000Z',
    })

    await run()

    expect(startWorkflow).toHaveBeenCalledWith(
      'onboardProjects',
      expect.objectContaining({
        workflowId: `onboard-review-${CATALOG_ID}-${Date.parse('2026-10-14T07:00:00.000Z')}`,
      }),
    )
  })

  it('tolerates an onboarding workflow that was already started', async () => {
    const alreadyStarted = new Error('already started')
    alreadyStarted.name = 'WorkflowExecutionAlreadyStartedError'
    startWorkflow.mockRejectedValueOnce(alreadyStarted)

    await run()

    expect(replacedMessage()).toMatchObject({ text: 'Approved — kops' })
  })

  it('leaves the approved row to the schedule when temporal is not configured', async () => {
    await run({ temporal: null })

    expect(startWorkflow).not.toHaveBeenCalled()
    expect(log.warn).toHaveBeenCalled()
    expect(replacedMessage()).toMatchObject({ text: 'Approved — kops' })
    expect(JSON.stringify(replacedMessage())).toContain('queued for the next onboarding run.')
  })

  it('keeps the approval when starting the onboarding workflow fails', async () => {
    startWorkflow.mockRejectedValueOnce(new Error('temporal down'))

    await run()

    expect(log.error).toHaveBeenCalled()
    expect(replacedMessage()).toMatchObject({ text: 'Approved — kops' })
    expect(JSON.stringify(replacedMessage())).toContain('queued for the next onboarding run.')
  })

  it('tells the reviewer when the row is no longer pending review', async () => {
    vi.mocked(resolveProjectCatalogReview).mockResolvedValue(null)

    await run()

    expect(startWorkflow).not.toHaveBeenCalled()
    expect(replacedMessage()).toMatchObject({
      text: 'This request was already reviewed or is no longer pending review.',
      replace_original: true,
    })
  })

  it('rejects an invalid catalog id before touching the database', async () => {
    await run({ catalogId: 'not-a-uuid' })

    expect(resolveProjectCatalogReview).not.toHaveBeenCalled()
    expect(replacedMessage()).toMatchObject({ text: ':no_entry: This request is no longer valid.' })
  })
})

describe('postReviewDecisionFailure', () => {
  it('keeps the review card in place so the reviewer can retry', async () => {
    vi.clearAllMocks()
    await postReviewDecisionFailure(RESPONSE_URL, log)

    const message = vi.mocked(postToResponseUrl).mock.calls[0][1]
    expect(message).not.toHaveProperty('replace_original')
    expect(JSON.stringify(message)).toContain('Please try again')
  })
})
