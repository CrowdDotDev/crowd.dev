import { describe, expect, it } from 'vitest'

import {
  buildBotAutoApplyDisabledReply,
  buildBotErroredReply,
  buildBotOnboardedReply,
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

  it('names the project the repository joined for integration actions', () => {
    for (const proposedAction of ['create_integration', 'update_integration'] as const) {
      const reply = buildBotOnboardedReply({ ...project, proposedAction })
      expect(reply).toContain(`${REPO_LABEL} is now in LFX Insights under *Acme*`)
      expect(reply).not.toContain('insights.linuxfoundation.org')
    }

    expect(
      buildBotOnboardedReply({
        ...project,
        proposedAction: 'update_integration',
        projectName: null,
      }),
    ).toContain('in its existing project')
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
        `👀 ${REPO_LABEL} needs a quick check by the CDP team before I add it. I've sent them your request.`,
        "You'll get the result in this thread.",
      ].join('\n'),
    )
    expect(
      buildBotReviewReply({ ...project, reviewReason: 'Acme uses an older <GitHub> connection.' }),
    ).toContain(
      `👀 ${REPO_LABEL}: Acme uses an older &lt;GitHub&gt; connection. I've sent the CDP team your request.`,
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
    expect(buildBotRejectedReply({ ...project, reviewedBy: 'U123' })).toBe(
      [
        `🚫 ${REPO_LABEL} wasn't added. <@U123> reviewed it and rejected the request.`,
        'Reply here if this looks wrong.',
      ].join('\n'),
    )
    expect(buildBotRejectedReply({ ...project, reviewedBy: null })).toContain(
      'The CDP team reviewed it',
    )
  })
})
