import { describe, expect, it } from 'vitest'

import {
  buildBotAutoApplyDisabledReply,
  buildBotErroredReply,
  buildBotOnboardedReply,
  buildBotReviewReply,
  buildBotSkippedReply,
  buildInsightsProjectUrl,
} from './botThreadReply'

const project = {
  repoUrl: 'https://github.com/acme/widget',
  projectSlug: 'acme-widget',
  proposedAction: null,
}

describe('botThreadReply', () => {
  it('links the insights project when a segment was created', () => {
    expect(buildBotOnboardedReply(project)).toContain(buildInsightsProjectUrl('acme-widget'))
    expect(buildBotOnboardedReply({ ...project, proposedAction: 'create_segment' })).toContain(
      'https://insights.linuxfoundation.org/project/',
    )
  })

  it('reports a connection to the existing project for integration actions', () => {
    for (const proposedAction of ['create_integration', 'update_integration'] as const) {
      const reply = buildBotOnboardedReply({ ...project, proposedAction })
      expect(reply).toContain('existing LFX Insights project')
      expect(reply).not.toContain('insights.linuxfoundation.org')
    }
  })

  it('truncates long reasons and escapes mrkdwn control characters', () => {
    const reply = buildBotSkippedReply(
      { repoUrl: 'https://github.com/acme/<widget>' },
      `a & b ${'x'.repeat(600)}`,
    )

    expect(reply).toContain('`https://github.com/acme/&lt;widget&gt;`')
    expect(reply).toContain('a &amp; b')
    expect(reply).toContain('…')
    expect(reply.length).toBeLessThan(700)
  })

  it('builds the review, auto apply and error replies around the repository', () => {
    expect(buildBotReviewReply({ ...project, reviewReason: null })).toContain('review channel')
    expect(buildBotReviewReply({ ...project, reviewReason: 'legacy <v1> integration' })).toContain(
      '```\nlegacy &lt;v1&gt; integration\n```',
    )
    expect(buildBotAutoApplyDisabledReply(project)).toContain('disabled')
    expect(buildBotErroredReply(project, 'boom')).toContain('boom')
  })
})
