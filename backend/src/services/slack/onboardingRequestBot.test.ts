import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@crowd/slack', () => ({ getSlackPermalink: vi.fn(), postSlackMessage: vi.fn() }))
vi.mock('@crowd/data-access-layer', () => ({
  bulkInsertProjectCatalog: vi.fn(async () => undefined),
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

import { buildQueuedReply, ingestOnboardingRequest, toRequestText } from './onboardingRequestBot'

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
      alreadyCatalogued: [],
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
      alreadyCatalogued: ['https://github.com/acme/one'],
    })
  })
})

describe('buildQueuedReply', () => {
  it('lists queued and already catalogued repositories and promises an outcome', () => {
    const reply = buildQueuedReply({
      queued: ['https://github.com/acme/two'],
      alreadyCatalogued: ['https://github.com/acme/one'],
    })

    expect(reply).toContain('Queued for onboarding evaluation:\n• https://github.com/acme/two')
    expect(reply).toContain('Already in the project catalog')
    expect(reply).toContain('• https://github.com/acme/one')
    expect(reply).toContain('The outcome will be posted in this thread.')
  })

  it('omits the already catalogued section when every repository is new', () => {
    const reply = buildQueuedReply({
      queued: ['https://github.com/acme/two'],
      alreadyCatalogued: [],
    })

    expect(reply).not.toContain('Already in the project catalog')
  })
})
