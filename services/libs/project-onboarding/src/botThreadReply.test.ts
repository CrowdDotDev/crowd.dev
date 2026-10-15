import { describe, expect, it } from 'vitest'

import {
  buildBotAutoApplyDisabledReply,
  buildBotErroredReply,
  buildBotOnboardedReply,
  buildBotDoneReply,
  buildBotRejectedReply,
  buildBotReviewReply,
  buildBotSkippedReply,
  buildInsightsProjectUrl,
} from './botThreadReply'

const project = {
  repoUrl: 'https://github.com/acme/widget',
  projectSlug: 'acme-widget',
  proposedAction: null,
  projectName: 'Acme',
  classificationKind: null,
}

const REPO_LABEL = '*<https://github.com/acme/widget|acme/widget>*'

describe('botThreadReply', () => {
  it('links the insights project when a segment was created', () => {
    const reply = buildBotOnboardedReply(project)

    expect(reply).toContain(`<${buildInsightsProjectUrl('acme-widget')}|View project>`)
    expect(reply).toContain('✅')
    expect(buildBotOnboardedReply({ ...project, proposedAction: 'create_segment' })).toContain(
      'https://insights.linuxfoundation.org/project/',
    )
  })

  it('reports the join to the existing project for integration actions without naming it', () => {
    for (const proposedAction of ['create_integration', 'update_integration'] as const) {
      const reply = buildBotOnboardedReply({ ...project, proposedAction })
      expect(reply).toContain(`${REPO_LABEL} is now in LFX Insights, in its existing project.`)
      expect(reply).not.toContain('Acme')
      expect(reply).not.toContain('insights.linuxfoundation.org')
    }
  })

  it('renders the repository as a linked owner/repo label', () => {
    expect(buildBotSkippedReply(project, 'it is already in LFX Insights')).toBe(
      [
        `🚫 ${REPO_LABEL} wasn't added: it is already in LFX Insights.`,
        'Reply here mentioning me with the project name and the GitHub links, or ask the CDP team in this channel.',
      ].join('\n'),
    )
  })

  it('truncates long reasons, drops trailing periods and escapes mrkdwn control characters', () => {
    const reply = buildBotSkippedReply(
      { repoUrl: 'https://gitlab.com/acme/<widget>', classificationKind: 'ambiguous' },
      `a & b ${'x'.repeat(600)}.`,
    )

    expect(reply).toContain('*https://gitlab.com/acme/&lt;widget&gt;*')
    expect(reply).toContain('a &amp; b')
    expect(reply).toContain('…')
    expect(reply).not.toContain('..')
    expect(reply.length).toBeLessThan(750)
  })

  it('reports an already tracked repository as a success without a next step', () => {
    expect(
      buildBotSkippedReply(
        { ...project, classificationKind: 'already_tracked' },
        'it is already in LFX Insights',
      ),
    ).toBe(`📘 ${REPO_LABEL} is already in LFX Insights. Nothing else to do.`)
  })

  it('tells the requester the CDP team has the request', () => {
    expect(buildBotReviewReply({ ...project, reviewReason: null })).toBe(
      [
        `👀 ${REPO_LABEL} needs a quick check before I add it. The CDP team can approve or reject it right here in this thread.`,
        "You'll get the result in this thread.",
      ].join('\n'),
    )
    expect(
      buildBotReviewReply({ ...project, reviewReason: 'Acme uses an older <GitHub> connection.' }),
    ).toContain(
      `👀 ${REPO_LABEL}: Acme uses an older &lt;GitHub&gt; connection. The CDP team can approve or reject it right here in this thread.`,
    )
    expect(
      buildBotReviewReply({
        ...project,
        proposedAction: 'human_review',
        reviewReason: 'Acme uses an older GitHub connection',
      }),
    ).toContain(
      `👀 ${REPO_LABEL}: Acme uses an older GitHub connection. The CDP team adds it by hand and marks it done right here in this thread.`,
    )
  })

  it('tells the requester when the repo was added by hand', () => {
    expect(buildBotDoneReply({ ...project, reviewedBy: 'U123' })).toBe(
      `✅ ${REPO_LABEL} was added to LFX Insights by hand by <@U123>. Activity shows up after the first data sync.`,
    )
    expect(buildBotDoneReply({ ...project, reviewedBy: null })).toContain(
      'by hand by the CDP team.',
    )
  })

  it('explains new projects and errors without internal switches or raw errors', () => {
    const disabled = buildBotAutoApplyDisabledReply(project)
    expect(disabled).toContain('New projects are added by the CDP team.')
    expect(disabled).not.toContain('disabled')

    const errored = buildBotErroredReply(project)
    expect(errored).toContain('⚠️ Something went wrong on our side')
    expect(errored).toContain('ask the CDP team'.replace('ask', 'Ask'))
  })

  it('mentions the reviewer who rejected the request', () => {
    const rejected = { ...project, reviewedBy: 'U123', decisionReason: null, decisionNote: null }
    expect(buildBotRejectedReply(rejected)).toBe(
      [
        `🚫 ${REPO_LABEL} wasn't added. <@U123> reviewed it and rejected the request.`,
        'Reply here if this looks wrong.',
      ].join('\n'),
    )
    expect(buildBotRejectedReply({ ...rejected, reviewedBy: null })).toContain(
      'The CDP team reviewed it',
    )
  })

  it('passes the rejection reason and the quoted note to the requester', () => {
    expect(
      buildBotRejectedReply({
        ...project,
        reviewedBy: 'U123',
        decisionReason: 'archived_or_fork',
        decisionNote: "Example sites aren't <tracked>.\nTry the main repo.",
      }),
    ).toBe(
      [
        `🚫 ${REPO_LABEL} wasn't added. <@U123> reviewed it: *Archived, fork or example repo*.`,
        "> Example sites aren't &lt;tracked&gt;.",
        '> Try the main repo.',
        'Reply here if this looks wrong.',
      ].join('\n'),
    )
    expect(
      buildBotRejectedReply({
        ...project,
        reviewedBy: 'U123',
        decisionReason: 'other',
        decisionNote: '   ',
      }),
    ).not.toContain('\n> ')
  })
})
