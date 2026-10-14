import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WorkflowIdReusePolicy } from '@crowd/temporal'

vi.mock('@crowd/slack', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@crowd/slack')>()),
  getSlackPermalink: vi.fn(async () => 'https://acme.slack.com/archives/C1/p1'),
  postSlackMessage: vi.fn(async () => ({ ok: true })),
}))
vi.mock('@crowd/data-access-layer', () => ({
  bulkInsertProjectCatalog: vi.fn(async (_qx: unknown, rows: { repoUrl: string }[]) =>
    rows.map((row, index) => ({ id: `id-${index + 1}`, repoUrl: row.repoUrl })),
  ),
  deriveProjectIdentityFromRepoUrl: vi.fn(() => ({ projectSlug: 'acme-one', repoName: 'one' })),
  findExistingProjectCatalogRepoUrls: vi.fn(async () => new Set<string>()),
  promoteProjectCatalogProvenance: vi.fn(async () => 0),
}))
vi.mock('./slackBackground', () => ({ getBgQx: vi.fn(async () => ({})) }))
vi.mock('@crowd/project-onboarding/src/requestLlm', () => ({
  createOnboardingRequestLlm: vi.fn(() => async () => null),
}))
vi.mock('@crowd/project-onboarding', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@crowd/project-onboarding')>()),
  parseOnboardingRequest: vi.fn(),
}))

import {
  bulkInsertProjectCatalog,
  findExistingProjectCatalogRepoUrls,
} from '@crowd/data-access-layer'
import { parseOnboardingRequest } from '@crowd/project-onboarding'
import { getSlackPermalink, postSlackMessage } from '@crowd/slack'

import { runOnboardingRequestBot } from './onboardingRequestBot'

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as any
const startWorkflow = vi.fn(async () => undefined)
const temporal = { workflow: { start: startWorkflow } } as never

const parsedRequest = {
  githubRepoUrls: ['https://github.com/acme/one'],
  nonGithubRepoUrls: [],
  linksToFollow: [],
  projectName: 'Acme',
  declaredLf: null,
  asksAboutHierarchy: false,
}

function parsedAs(overrides: Partial<typeof parsedRequest>) {
  vi.mocked(parseOnboardingRequest).mockResolvedValueOnce({
    ok: true,
    request: { ...parsedRequest, ...overrides },
  })
}

function run(overrides: Record<string, unknown> = {}) {
  return runOnboardingRequestBot({
    text: '<@U0BOT> onboard Acme <https://github.com/acme/one>',
    channelId: 'C1',
    messageTs: '100.1',
    threadTs: '90.0',
    options: { log, temporal },
    ...overrides,
  })
}

describe('runOnboardingRequestBot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(postSlackMessage).mockResolvedValue({ ok: true })
    vi.mocked(findExistingProjectCatalogRepoUrls).mockResolvedValue(new Set())
    vi.mocked(parseOnboardingRequest).mockResolvedValue({ ok: true, request: parsedRequest })
  })

  it('queues the repositories of the mentioned message, starts their evaluation and replies in the thread', async () => {
    await run()

    expect(getSlackPermalink).toHaveBeenCalledWith('C1', '100.1')
    expect(bulkInsertProjectCatalog).toHaveBeenCalledWith(expect.anything(), [
      expect.objectContaining({
        repoUrl: 'https://github.com/acme/one',
        sourceUrl: 'https://acme.slack.com/archives/C1/p1',
        requestText: 'onboard Acme https://github.com/acme/one',
        action: 'auto',
        projectName: 'Acme',
      }),
    ])
    expect(startWorkflow).toHaveBeenCalledWith('evaluateProjects', {
      taskQueue: 'projects-evaluation',
      workflowId: 'evaluate-slack-C1-100.1',
      workflowIdReusePolicy: WorkflowIdReusePolicy.REJECT_DUPLICATE,
      args: [{ catalogIds: ['id-1'] }],
    })
    expect(postSlackMessage).toHaveBeenCalledWith({
      channel: 'C1',
      thread_ts: '90.0',
      text: expect.stringContaining('⏳ Checking *<https://github.com/acme/one|acme/one>*…'),
    })
    expect(log.warn).not.toHaveBeenCalled()
  })

  it('does not start an evaluation when every repository was already catalogued', async () => {
    vi.mocked(findExistingProjectCatalogRepoUrls).mockResolvedValue(
      new Set(['https://github.com/acme/one']),
    )

    await run()

    expect(bulkInsertProjectCatalog).toHaveBeenCalledWith(expect.anything(), [])
    expect(startWorkflow).not.toHaveBeenCalled()
    expect(postSlackMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('was already requested') }),
    )
  })

  it('tells the requester the rows were recorded when the evaluation cannot be started', async () => {
    startWorkflow.mockRejectedValueOnce(new Error('temporal down'))

    await run()

    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'temporal down', channelId: 'C1', catalogIds: ['id-1'] }),
      'Immediate evaluation could not be started for the Slack request.',
    )
    expect(postSlackMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringMatching(/Checking[\s\S]*next scheduled evaluation/),
      }),
    )
    expect(postSlackMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining("couldn't record this request") }),
    )
  })

  it('leaves the rows to the scheduled evaluation when Temporal is not configured', async () => {
    await run({ options: { log, temporal: null } })

    expect(startWorkflow).not.toHaveBeenCalled()
    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ channelId: 'C1', catalogIds: ['id-1'] }),
      'Temporal is not configured, the Slack request waits for the scheduled evaluation.',
    )
    expect(postSlackMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringMatching(/Checking[\s\S]*next scheduled evaluation/),
      }),
    )
  })

  it('names the unsupported host when the only repository is not on GitHub, without touching the catalog', async () => {
    parsedAs({ githubRepoUrls: [], nonGithubRepoUrls: ['https://gitlab.com/acme/one'] })

    await run({ text: '<@U0BOT> please onboard Acme, it lives on https://gitlab.com/acme/one' })

    expect(getSlackPermalink).not.toHaveBeenCalled()
    expect(bulkInsertProjectCatalog).not.toHaveBeenCalled()
    expect(postSlackMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('*gitlab.com/acme/one* is on GitLab'),
      }),
    )
  })

  it('asks for the GitHub links when only a web page was linked', async () => {
    parsedAs({ githubRepoUrls: [], linksToFollow: ['https://wiki.example.org/projects'] })

    await run({ text: '<@U0BOT> onboard the project at https://wiki.example.org/projects' })

    expect(bulkInsertProjectCatalog).not.toHaveBeenCalled()
    expect(postSlackMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining("I don't open web pages") }),
    )
  })

  it('asks for the missing link and keeps the project name the requester gave', async () => {
    parsedAs({ githubRepoUrls: [], projectName: 'Purgatoria' })

    await run({ text: '<@U0BOT> please onboard Purgatoria, it is a new AI lab project' })

    expect(bulkInsertProjectCatalog).not.toHaveBeenCalled()
    expect(postSlackMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('I need at least one GitHub link to add *Purgatoria*.'),
      }),
    )
  })

  it('answers a hierarchy question without creating a row, even when a repository is linked', async () => {
    parsedAs({ asksAboutHierarchy: true, projectName: 'pointblank' })

    await run({
      text: '<@U0BOT> should pointblank https://github.com/acme/one be under CNCF or LFN?',
    })

    expect(getSlackPermalink).not.toHaveBeenCalled()
    expect(bulkInsertProjectCatalog).not.toHaveBeenCalled()
    expect(postSlackMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining(
          "which foundation *pointblank* belongs to, and I can't decide that",
        ),
      }),
    )
  })

  it('queues the repositories the parser found that the text regex cannot see', async () => {
    parsedAs({ githubRepoUrls: ['https://github.com/acme/tool', 'https://github.com/acme/one'] })

    await run({ text: '<@U0BOT> onboard Acme acme/tool and <https://github.com/acme/one>' })

    expect(bulkInsertProjectCatalog).toHaveBeenCalledWith(expect.anything(), [
      expect.objectContaining({ repoUrl: 'https://github.com/acme/tool' }),
      expect.objectContaining({ repoUrl: 'https://github.com/acme/one' }),
    ])
  })

  it('falls back to the GitHub links in the text when the parser fails', async () => {
    vi.mocked(parseOnboardingRequest).mockRejectedValueOnce(new Error('bedrock down'))

    await run()

    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ channelId: 'C1', error: 'bedrock down' }),
      'Onboarding request parser failed, falling back to the GitHub links in the text.',
    )
    expect(bulkInsertProjectCatalog).toHaveBeenCalledWith(expect.anything(), [
      expect.objectContaining({ repoUrl: 'https://github.com/acme/one', projectName: null }),
    ])
    expect(postSlackMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('⏳ Checking') }),
    )
  })

  it('uses a generic missing-link reply when the parser is unavailable and no link was found', async () => {
    vi.mocked(parseOnboardingRequest).mockResolvedValueOnce({ ok: false, reason: 'no answer' })

    await run({ text: '<@U0BOT> please onboard Acme' })

    expect(bulkInsertProjectCatalog).not.toHaveBeenCalled()
    expect(postSlackMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('I need at least one GitHub link to add this project.'),
      }),
    )
  })

  it('explains itself when only the mention is left or the user asks for help', async () => {
    await run({ text: '<@U0BOT>' })
    await run({ text: '<@U0BOT> Help' })

    expect(parseOnboardingRequest).not.toHaveBeenCalled()
    expect(bulkInsertProjectCatalog).not.toHaveBeenCalled()
    expect(postSlackMessage).toHaveBeenCalledTimes(2)
    expect(postSlackMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('Hi! I add GitHub repositories') }),
    )
  })

  it('warns when Slack does not deliver the reply', async () => {
    vi.mocked(postSlackMessage).mockResolvedValue({ ok: false, error: 'channel_not_found' })

    await run()

    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ channelId: 'C1', error: 'channel_not_found' }),
      'Slack bot reply was not delivered.',
    )
  })

  it('fails the request instead of queueing rows without a Slack permalink', async () => {
    vi.mocked(getSlackPermalink).mockResolvedValueOnce(null)

    await run()

    expect(bulkInsertProjectCatalog).not.toHaveBeenCalled()
    expect(postSlackMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining("couldn't record this request") }),
    )
  })

  it('reports a failure in the thread when the request cannot be recorded', async () => {
    vi.mocked(bulkInsertProjectCatalog).mockRejectedValueOnce(new Error('db down'))

    await run()

    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'db down', channelId: 'C1' }),
      'Slack request failed.',
    )
    expect(postSlackMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining("couldn't record this request") }),
    )
  })
})
