import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@crowd/slack', () => ({
  getSlackPermalink: vi.fn(async () => 'https://acme.slack.com/archives/C1/p1'),
  postSlackMessage: vi.fn(async () => ({ ok: true })),
}))
vi.mock('@crowd/data-access-layer', () => ({
  bulkInsertProjectCatalog: vi.fn(async () => undefined),
  deriveProjectIdentityFromRepoUrl: vi.fn(() => ({ projectSlug: 'acme-one', repoName: 'one' })),
  findExistingProjectCatalogRepoUrls: vi.fn(async () => new Set<string>()),
  promoteProjectCatalogProvenance: vi.fn(async () => 0),
}))
vi.mock('./slackBackground', () => ({ getBgQx: vi.fn(async () => ({})) }))

import {
  bulkInsertProjectCatalog,
  findExistingProjectCatalogRepoUrls,
} from '@crowd/data-access-layer'
import { getSlackPermalink, postSlackMessage } from '@crowd/slack'

import { runOnboardingRequestBot } from './onboardingRequestBot'

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as any

function run(overrides: Record<string, unknown> = {}) {
  return runOnboardingRequestBot({
    text: '<@U0BOT> onboard Acme <https://github.com/acme/one>',
    channelId: 'C1',
    messageTs: '100.1',
    threadTs: '90.0',
    options: { log },
    ...overrides,
  })
}

describe('runOnboardingRequestBot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(postSlackMessage).mockResolvedValue({ ok: true })
    vi.mocked(findExistingProjectCatalogRepoUrls).mockResolvedValue(new Set())
  })

  it('queues the repositories of the mentioned message and replies in the thread', async () => {
    await run()

    expect(getSlackPermalink).toHaveBeenCalledWith('C1', '100.1')
    expect(bulkInsertProjectCatalog).toHaveBeenCalledWith(expect.anything(), [
      expect.objectContaining({
        repoUrl: 'https://github.com/acme/one',
        sourceUrl: 'https://acme.slack.com/archives/C1/p1',
        requestText: 'onboard Acme https://github.com/acme/one',
        action: 'auto',
      }),
    ])
    expect(postSlackMessage).toHaveBeenCalledWith({
      channel: 'C1',
      thread_ts: '90.0',
      text: expect.stringContaining('Queued for onboarding evaluation'),
    })
    expect(log.warn).not.toHaveBeenCalled()
  })

  it('asks for a GitHub repository when the request names none, without touching the catalog', async () => {
    await run({ text: '<@U0BOT> please onboard Acme, it lives on gitlab.com/acme/one' })

    expect(getSlackPermalink).not.toHaveBeenCalled()
    expect(bulkInsertProjectCatalog).not.toHaveBeenCalled()
    expect(postSlackMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('could not find a GitHub repository'),
      }),
    )
  })

  it('asks for the request details when only the mention is left', async () => {
    await run({ text: '<@U0BOT>' })

    expect(bulkInsertProjectCatalog).not.toHaveBeenCalled()
    expect(postSlackMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('Tell me about the project') }),
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
      expect.objectContaining({ text: expect.stringContaining('could not record this request') }),
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
      expect.objectContaining({ text: expect.stringContaining('could not record this request') }),
    )
  })
})
