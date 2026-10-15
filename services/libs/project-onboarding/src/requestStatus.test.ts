import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  findSlackOnboardingRequest,
  findProjectCatalogBySourceUrl,
  claimSlackOnboardingRequestDone,
  updateSlackMessage,
  postSlackContentInThread,
} = vi.hoisted(() => ({
  findSlackOnboardingRequest: vi.fn(),
  findProjectCatalogBySourceUrl: vi.fn(),
  claimSlackOnboardingRequestDone: vi.fn(),
  updateSlackMessage: vi.fn(),
  postSlackContentInThread: vi.fn(),
}))
vi.mock('@crowd/data-access-layer', () => ({
  findSlackOnboardingRequest,
  findProjectCatalogBySourceUrl,
  claimSlackOnboardingRequestDone,
}))
vi.mock('@crowd/slack', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@crowd/slack')>()),
  updateSlackMessage,
  postSlackContentInThread,
}))

import {
  RequestStatusRow,
  buildAllDoneReply,
  buildRequestStatusContent,
  isRequestSettled,
  refreshRequestStatusMessage,
  reportRequestOutcome,
  requestStatusLine,
  requestSummaryLine,
} from './requestStatus'

function row(overrides: Partial<RequestStatusRow> & { repoUrl: string }): RequestStatusRow {
  return {
    action: 'auto',
    classificationKind: null,
    reviewReason: null,
    skipReason: null,
    matchedProjectName: null,
    reviewedBy: null,
    decisionReason: null,
    decisionNote: null,
    ...overrides,
  }
}

const ONE = 'https://github.com/acme/one'
const TWO = 'https://github.com/acme/two'
const sourceUrl = 'https://acme.slack.com/archives/C1/p1760000000123456'
const request = { id: 'row-1', repoUrl: ONE, sourceUrl }

describe('requestStatusLine', () => {
  it('shows one labelled line per state', () => {
    expect(requestStatusLine(row({ repoUrl: ONE }))).toBe(
      '⏳ *<https://github.com/acme/one|acme/one>* · checking…',
    )
    expect(
      requestStatusLine(
        row({ repoUrl: ONE, action: 'review', reviewReason: 'Acme needs a <look>' }),
      ),
    ).toBe(
      '👀 *<https://github.com/acme/one|acme/one>* · with the CDP team: Acme needs a &lt;look&gt;',
    )
    expect(
      requestStatusLine(row({ repoUrl: ONE, action: 'onboarded', matchedProjectName: 'Acme' })),
    ).toBe('✅ *<https://github.com/acme/one|acme/one>* · added to *Acme*')
    expect(
      requestStatusLine(
        row({ repoUrl: ONE, action: 'skip', classificationKind: 'already_tracked' }),
      ),
    ).toBe('📘 *<https://github.com/acme/one|acme/one>* · already in LFX Insights')
    expect(
      requestStatusLine(
        row({
          repoUrl: ONE,
          action: 'skip',
          skipReason: 'rejected in review by U123',
          reviewedBy: 'U123',
          decisionReason: 'wrong_project',
          decisionNote: 'Belongs to <Beta>.',
        }),
      ),
    ).toBe(
      '🚫 *<https://github.com/acme/one|acme/one>* · not added: <@U123> reviewed it: Wrong project\n> Belongs to &lt;Beta&gt;.',
    )
    expect(requestStatusLine(row({ repoUrl: ONE, action: 'error' }))).toBe(
      '⚠️ *<https://github.com/acme/one|acme/one>* · something went wrong on our side',
    )
  })

  it('shortens a long reason', () => {
    const line = requestStatusLine(
      row({ repoUrl: ONE, action: 'review', reviewReason: 'x'.repeat(300) }),
    )

    expect(line).toContain(`${'x'.repeat(160)}…`)
  })
})

describe('summary and settlement', () => {
  const rows = [
    row({ repoUrl: ONE, action: 'onboarded' }),
    row({ repoUrl: TWO, action: 'review' }),
    row({ repoUrl: 'https://github.com/acme/three', action: 'skip' }),
  ]

  it('counts the states in a fixed order and includes the tracked repositories', () => {
    expect(requestSummaryLine(rows, 1)).toBe(
      '1 added, 1 already there, 1 with the CDP team, 1 not added',
    )
    expect(requestSummaryLine([row({ repoUrl: ONE })])).toBe('1 checking')
    expect(buildAllDoneReply(rows)).toBe('✅ All done: 1 added, 1 with the CDP team, 1 not added.')
  })

  it('is settled only when nothing is being checked or reviewed', () => {
    expect(isRequestSettled(rows)).toBe(false)
    expect(isRequestSettled([rows[0], rows[2], row({ repoUrl: TWO, action: 'error' })])).toBe(true)
  })
})

describe('buildRequestStatusContent', () => {
  const header = {
    lines: [
      '📘 *<https://github.com/acme/zero|acme/zero>* is already in LFX Insights under *Acme*.',
    ],
    buttons: [{ text: 'View Acme in LFX Insights', url: 'https://insights.test/acme' }],
  }

  it('keeps the header lines, adds one line per row, a summary and the buttons', () => {
    const content = buildRequestStatusContent({
      header,
      rows: [row({ repoUrl: ONE, action: 'onboarded' }), row({ repoUrl: TWO })],
      alreadyTracked: 1,
    })

    expect(content.text.split('\n')).toEqual([
      header.lines[0],
      '✅ *<https://github.com/acme/one|acme/one>* · added',
      '⏳ *<https://github.com/acme/two|acme/two>* · checking…',
      '_1 added, 1 already there, 1 checking_',
    ])
    expect(JSON.stringify(content.blocks)).toContain('"action_id":"view_insights_project:0"')
  })

  it('skips the summary for a single repository and adds the closing line when asked', () => {
    const content = buildRequestStatusContent({
      header: { lines: [], buttons: [] },
      rows: [row({ repoUrl: ONE })],
      closing: 'I will update this message.',
    })

    expect(content).toEqual({
      text: '⏳ *<https://github.com/acme/one|acme/one>* · checking…\nI will update this message.',
    })
  })
})

describe('refreshRequestStatusMessage and reportRequestOutcome', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    updateSlackMessage.mockResolvedValue({ ok: true })
    postSlackContentInThread.mockResolvedValue({ ok: true })
    claimSlackOnboardingRequestDone.mockResolvedValue(true)
  })

  it('edits the status message from the rows of the request', async () => {
    findSlackOnboardingRequest.mockResolvedValue({
      sourceUrl,
      channel: 'C1',
      messageTs: '1.1',
      header: { lines: [], buttons: [] },
    })
    findProjectCatalogBySourceUrl.mockResolvedValue([row({ repoUrl: ONE, action: 'onboarded' })])

    expect(await reportRequestOutcome({} as never, request, 'fallback')).toEqual({ ok: true })

    expect(updateSlackMessage).toHaveBeenCalledWith({
      channel: 'C1',
      ts: '1.1',
      text: '✅ *<https://github.com/acme/one|acme/one>* · added',
    })
    expect(postSlackContentInThread).not.toHaveBeenCalled()
  })

  it('announces once when a multi-repo request is fully settled', async () => {
    findSlackOnboardingRequest.mockResolvedValue({
      sourceUrl,
      channel: 'C1',
      messageTs: '1.1',
      header: { lines: [], buttons: [] },
    })
    findProjectCatalogBySourceUrl.mockResolvedValue([
      row({ repoUrl: ONE, action: 'onboarded' }),
      row({ repoUrl: TWO, action: 'skip' }),
    ])
    claimSlackOnboardingRequestDone.mockResolvedValueOnce(true).mockResolvedValueOnce(false)

    await refreshRequestStatusMessage({} as never, request)
    await refreshRequestStatusMessage({} as never, request)

    expect(postSlackContentInThread).toHaveBeenCalledTimes(1)
    expect(postSlackContentInThread).toHaveBeenCalledWith(sourceUrl, {
      text: '✅ All done: 1 added, 1 not added.',
    })
  })

  it('falls back to a thread reply for requests without a status message', async () => {
    findSlackOnboardingRequest.mockResolvedValue(null)

    expect(await reportRequestOutcome({} as never, request, { text: 'hello' })).toEqual({
      ok: true,
    })

    expect(updateSlackMessage).not.toHaveBeenCalled()
    expect(postSlackContentInThread).toHaveBeenCalledWith(sourceUrl, { text: 'hello' })
  })

  it('falls back when the edit fails and reports rows without a Slack origin', async () => {
    findSlackOnboardingRequest.mockResolvedValue({
      sourceUrl,
      channel: 'C1',
      messageTs: '1.1',
      header: { lines: [], buttons: [] },
    })
    findProjectCatalogBySourceUrl.mockResolvedValue([row({ repoUrl: ONE })])
    updateSlackMessage.mockResolvedValue({ ok: false, error: 'message_not_found' })

    expect(await reportRequestOutcome({} as never, request, 'hello')).toEqual({ ok: true })
    expect(postSlackContentInThread).toHaveBeenCalledWith(sourceUrl, { text: 'hello' })

    expect(await reportRequestOutcome({} as never, { ...request, sourceUrl: null }, 'x')).toEqual({
      ok: false,
      error: 'request has no Slack origin',
    })
  })
})
