import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@crowd/slack', () => ({ getSlackPermalink: vi.fn(), postSlackMessage: vi.fn() }))
vi.mock('@crowd/data-access-layer', () => ({
  bulkInsertProjectCatalog: vi.fn(async (_qx: unknown, rows: { repoUrl: string }[]) =>
    rows.map((row, index) => ({ id: `id-${index + 1}`, repoUrl: row.repoUrl })),
  ),
  deriveProjectIdentityFromRepoUrl: vi.fn((repoUrl: string) => {
    const [owner, repo] = repoUrl.split('/').slice(-2)
    return { projectSlug: `${owner}-${repo}`, repoName: repo }
  }),
  findExistingProjectCatalogRepoUrls: vi.fn(async () => new Set<string>()),
  promoteProjectCatalogProvenance: vi.fn(async () => 0),
}))
vi.mock('./slackBackground', () => ({ getBgQx: vi.fn() }))

import {
  bulkInsertProjectCatalog,
  findExistingProjectCatalogRepoUrls,
  promoteProjectCatalogProvenance,
} from '@crowd/data-access-layer'
import type { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'

import {
  buildQueuedReply,
  ingestOnboardingRequest,
  startOnboardingRequestEvaluation,
  toRequestText,
} from './onboardingRequestBot'

const qx = {} as QueryExecutor

describe('toRequestText', () => {
  it('removes the bot mention and keeps the rest of the message', () => {
    expect(toRequestText('<@U0BOT> onboard Acme\nnot LF')).toBe('onboard Acme\nnot LF')
  })

  it('unwraps Slack links so plain URLs remain', () => {
    expect(
      toRequestText(
        '<@U0BOT> <https://github.com/acme/one> and <https://github.com/acme/two|acme/two>',
      ),
    ).toBe('https://github.com/acme/one and https://github.com/acme/two')
  })

  it('decodes the HTML entities Slack applies to the message text', () => {
    expect(toRequestText('<@U0BOT> onboard R&amp;D &lt;internal&gt;')).toBe(
      'onboard R&D <internal>',
    )
  })

  it('returns an empty string when only the mention is left', () => {
    expect(toRequestText('<@U0BOT>  ')).toBe('')
  })
})

describe('ingestOnboardingRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(findExistingProjectCatalogRepoUrls).mockResolvedValue(new Set())
  })

  it('inserts auto rows carrying the request text and the Slack permalink', async () => {
    const result = await ingestOnboardingRequest(qx, {
      requestText: 'please onboard Acme',
      repoUrls: ['https://github.com/acme/one', 'https://github.com/acme/two'],
      sourceUrl: 'https://acme.slack.com/archives/C1/p1',
    })

    expect(bulkInsertProjectCatalog).toHaveBeenCalledWith(qx, [
      {
        projectSlug: 'acme-one',
        repoName: 'one',
        repoUrl: 'https://github.com/acme/one',
        source: 'slack-bot',
        sourceUrl: 'https://acme.slack.com/archives/C1/p1',
        provenance: 'slack-bot',
        action: 'auto',
        requestText: 'please onboard Acme',
        projectName: null,
      },
      expect.objectContaining({ repoUrl: 'https://github.com/acme/two' }),
    ])
    expect(promoteProjectCatalogProvenance).toHaveBeenCalledWith(qx, 'slack-bot', [])
    expect(result).toEqual({
      queued: ['https://github.com/acme/one', 'https://github.com/acme/two'],
      queuedIds: ['id-1', 'id-2'],
      alreadyCatalogued: [],
    })
  })

  it('treats a repository inserted concurrently as already catalogued and links it', async () => {
    vi.mocked(bulkInsertProjectCatalog).mockResolvedValueOnce([])

    const result = await ingestOnboardingRequest(qx, {
      requestText: 'please onboard Acme',
      repoUrls: ['https://github.com/acme/one'],
      sourceUrl: 'https://acme.slack.com/archives/C1/p1',
    })

    expect(promoteProjectCatalogProvenance).toHaveBeenCalledWith(qx, 'slack-bot', [
      {
        repoUrl: 'https://github.com/acme/one',
        sourceUrl: 'https://acme.slack.com/archives/C1/p1',
      },
    ])
    expect(result).toEqual({
      queued: [],
      queuedIds: [],
      alreadyCatalogued: ['https://github.com/acme/one'],
    })
  })

  it('links already catalogued repositories to the request instead of inserting them', async () => {
    vi.mocked(findExistingProjectCatalogRepoUrls).mockResolvedValue(
      new Set(['https://github.com/acme/one']),
    )

    const result = await ingestOnboardingRequest(qx, {
      requestText: 'please onboard Acme',
      repoUrls: ['https://github.com/acme/one', 'https://github.com/acme/two'],
      sourceUrl: 'https://acme.slack.com/archives/C1/p1',
    })

    expect(promoteProjectCatalogProvenance).toHaveBeenCalledWith(qx, 'slack-bot', [
      {
        repoUrl: 'https://github.com/acme/one',
        sourceUrl: 'https://acme.slack.com/archives/C1/p1',
      },
    ])
    expect(bulkInsertProjectCatalog).toHaveBeenCalledWith(qx, [
      expect.objectContaining({ repoUrl: 'https://github.com/acme/two' }),
    ])
    expect(result).toEqual({
      queued: ['https://github.com/acme/two'],
      queuedIds: ['id-1'],
      alreadyCatalogued: ['https://github.com/acme/one'],
    })
  })
})

describe('startOnboardingRequestEvaluation', () => {
  const request = { channelId: 'C1', messageTs: '100.1', catalogIds: ['id-1'] }

  it('starts the evaluation workflow for the inserted rows with a deterministic id', async () => {
    const start = vi.fn(async () => undefined)

    await startOnboardingRequestEvaluation({ workflow: { start } } as never, request)

    expect(start).toHaveBeenCalledWith('evaluateProjects', {
      taskQueue: 'projects-evaluation',
      workflowId: 'evaluate-slack-C1-100.1',
      args: [{ catalogIds: ['id-1'] }],
    })
  })

  it('ignores a workflow that was already started for the same message', async () => {
    const alreadyStarted = new Error('already started')
    alreadyStarted.name = 'WorkflowExecutionAlreadyStartedError'
    const start = vi.fn(async () => {
      throw alreadyStarted
    })

    await expect(
      startOnboardingRequestEvaluation({ workflow: { start } } as never, request),
    ).resolves.toBeUndefined()
  })

  it('propagates any other failure', async () => {
    const start = vi.fn(async () => {
      throw new Error('temporal down')
    })

    await expect(
      startOnboardingRequestEvaluation({ workflow: { start } } as never, request),
    ).rejects.toThrow('temporal down')
  })
})

describe('buildQueuedReply', () => {
  it('lists queued and already catalogued repositories and promises an outcome', () => {
    const reply = buildQueuedReply(
      {
        queued: ['https://github.com/acme/two'],
        queuedIds: ['id-1'],
        alreadyCatalogued: ['https://github.com/acme/one'],
      },
      true,
    )

    expect(reply).toContain('Queued for onboarding evaluation:\n• https://github.com/acme/two')
    expect(reply).toContain('Already in the project catalog, not queued again')
    expect(reply).toContain('• https://github.com/acme/one')
    expect(reply).toContain('Evaluation started, the outcome will be posted in this thread.')
  })

  it('omits the already catalogued section when every repository is new', () => {
    const reply = buildQueuedReply(
      { queued: ['https://github.com/acme/two'], queuedIds: ['id-1'], alreadyCatalogued: [] },
      true,
    )

    expect(reply).not.toContain('Already in the project catalog')
  })

  it('warns that the scheduled evaluation will pick the rows up when the start failed', () => {
    const reply = buildQueuedReply(
      { queued: ['https://github.com/acme/two'], queuedIds: ['id-1'], alreadyCatalogued: [] },
      false,
    )

    expect(reply).toContain('next scheduled evaluation')
    expect(reply).not.toContain('Evaluation started')
  })

  it('does not promise an outcome when nothing was queued', () => {
    const reply = buildQueuedReply(
      { queued: [], queuedIds: [], alreadyCatalogued: ['https://github.com/acme/one'] },
      true,
    )

    expect(reply).not.toContain('the outcome will be posted in this thread.')
  })
})
