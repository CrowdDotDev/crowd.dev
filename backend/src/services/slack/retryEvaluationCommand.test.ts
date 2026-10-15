import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@crowd/data-access-layer', () => ({
  requeueProjectCatalogEvaluation: vi.fn(),
}))
vi.mock('./onboardProjectCommand', () => ({
  postToResponseUrl: vi.fn(async () => undefined),
  textMessage: vi.fn((text: string) => ({ text })),
}))
vi.mock('./slackBackground', () => ({ getBgQx: vi.fn(async () => ({})) }))
vi.mock('@crowd/project-onboarding', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@crowd/project-onboarding')>()),
  applyRequestStatus: vi.fn(async () => undefined),
  refreshRequestStatusMessage: vi.fn(async () => false),
}))

import { requeueProjectCatalogEvaluation } from '@crowd/data-access-layer'
import { applyRequestStatus, refreshRequestStatusMessage } from '@crowd/project-onboarding'

import { postToResponseUrl } from './onboardProjectCommand'
import { runRetryEvaluationCommand } from './retryEvaluationCommand'

const CATALOG_ID = '8f1c2a44-5b7e-4d2f-9c1a-3e6f7a8b9c0d'
const RESPONSE_URL = 'https://hooks.slack.com/response'
const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as any
const startWorkflow = vi.fn(async () => undefined)
const temporal = { workflow: { start: startWorkflow } } as never

const row = {
  id: CATALOG_ID,
  repoUrl: 'https://github.com/kubernetes/kops',
  sourceUrl: 'https://acme.slack.com/archives/C1/p1760000000123456',
  action: 'evaluate',
} as any

function run(overrides: Record<string, unknown> = {}) {
  return runRetryEvaluationCommand({
    catalogId: CATALOG_ID,
    responseUrl: RESPONSE_URL,
    actorId: 'U123',
    temporal,
    log,
    ...overrides,
  })
}

function lastMessage() {
  const calls = vi.mocked(postToResponseUrl).mock.calls
  return calls[calls.length - 1][1]
}

describe('runRetryEvaluationCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requeueProjectCatalogEvaluation).mockResolvedValue(row)
  })

  it('requeues the row, starts its evaluation and puts the request back in progress', async () => {
    await run()

    expect(requeueProjectCatalogEvaluation).toHaveBeenCalledWith(expect.anything(), CATALOG_ID)
    expect(startWorkflow).toHaveBeenCalledWith(
      'evaluateProjects',
      expect.objectContaining({
        taskQueue: 'projects-evaluation',
        args: [{ catalogIds: [CATALOG_ID] }],
      }),
    )
    expect(lastMessage()).toMatchObject({ replace_original: true })
    expect(JSON.stringify(lastMessage())).toContain(
      'Checking *<https://github.com/kubernetes/kops|kubernetes/kops>* again',
    )
    expect(applyRequestStatus).toHaveBeenCalledWith(expect.anything(), row, 'checking')
    expect(refreshRequestStatusMessage).toHaveBeenCalledWith(expect.anything(), row)
    expect(vi.mocked(applyRequestStatus).mock.invocationCallOrder[0]).toBeLessThan(
      startWorkflow.mock.invocationCallOrder[0],
    )
  })

  it('leaves the row to the schedule when temporal is not configured or fails', async () => {
    await run({ temporal: null })
    expect(JSON.stringify(lastMessage())).toContain('queued for the next scheduled check')

    startWorkflow.mockRejectedValueOnce(new Error('temporal down'))
    await run()
    expect(JSON.stringify(lastMessage())).toContain('queued for the next scheduled check')
    expect(log.error).toHaveBeenCalled()
  })

  it('tells the clicker when the row is no longer waiting for a retry', async () => {
    vi.mocked(requeueProjectCatalogEvaluation).mockResolvedValue(null)

    await run()

    expect(startWorkflow).not.toHaveBeenCalled()
    expect(lastMessage()).toMatchObject({
      text: 'This request is no longer waiting for a retry.',
      response_type: 'ephemeral',
    })
    expect(applyRequestStatus).not.toHaveBeenCalled()
  })

  it('rejects an invalid catalog id before touching the database', async () => {
    await run({ catalogId: 'nope' })

    expect(requeueProjectCatalogEvaluation).not.toHaveBeenCalled()
    expect(lastMessage()).toMatchObject({ text: ':no_entry: This request is no longer valid.' })
  })
})
