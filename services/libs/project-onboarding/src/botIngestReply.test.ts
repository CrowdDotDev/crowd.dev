import { describe, expect, it } from 'vitest'

import {
  IngestReplyRequest,
  buildBotFailureReply,
  buildBotHelpReply,
  buildBotHierarchyQuestionReply,
  buildBotNoRepositoryReply,
  buildBotQueuedReply,
} from './botIngestReply'

const request: IngestReplyRequest = {
  projectName: 'Purgatoria',
  declaredLf: null,
  githubRepoUrls: [],
  nonGithubRepoUrls: [],
  linksToFollow: [],
}

describe('buildBotHelpReply', () => {
  it('says what the bot does, the three inputs, one example and the limits', () => {
    const help = buildBotHelpReply()

    expect(help).toContain('Hi! I add GitHub repositories to LFX Insights.')
    expect(help).toContain('1. the project name')
    expect(help).toContain('3. one or more GitHub repository links')
    expect(help).toContain('`@LFX Onboarding onboard Envoy, LF project, github.com/envoyproxy/xds')
    expect(help).toContain('Only GitHub links work for now.')
  })
})

describe('buildBotHierarchyQuestionReply', () => {
  it('declines the question and shows the exact request to send, repo included', () => {
    expect(
      buildBotHierarchyQuestionReply({
        ...request,
        projectName: 'pointblank',
        githubRepoUrls: ['https://github.com/posit-dev/pointblank'],
      }),
    ).toBe(
      [
        "That's a question about which foundation *pointblank* belongs to, and I can't decide that. I only add repositories to LFX Insights.",
        'If you want it added, send: @LFX Onboarding onboard pointblank github.com/posit-dev/pointblank',
      ].join('\n'),
    )
  })

  it('falls back to placeholders without a name or a repo', () => {
    const reply = buildBotHierarchyQuestionReply({ ...request, projectName: null })

    expect(reply).toContain('which foundation this project belongs to')
    expect(reply).toContain('onboard &lt;project&gt; github.com/org/repo')
  })

  it('keeps the LF declaration the requester gave in the request to resend', () => {
    expect(buildBotHierarchyQuestionReply({ ...request, declaredLf: true })).toContain(
      'onboard Purgatoria, LF project, github.com/org/repo',
    )
    expect(buildBotNoRepositoryReply({ ...request, declaredLf: false })).toContain(
      'onboard Purgatoria, not an LF project, github.com/org/repo',
    )
  })
})

describe('buildBotNoRepositoryReply', () => {
  it('names the host when the only repository is not on GitHub', () => {
    expect(
      buildBotNoRepositoryReply({
        ...request,
        projectName: 'libxml2',
        nonGithubRepoUrls: ['https://gitlab.gnome.org/GNOME/libxml2'],
      }),
    ).toBe(
      [
        '🚫 I can only add *GitHub* repositories, and *gitlab.gnome.org/GNOME/libxml2* is on GitLab.',
        'If libxml2 has a GitHub mirror, send me that link. Otherwise ask the CDP team in this channel to connect it by hand.',
      ].join('\n'),
    )
    expect(
      buildBotNoRepositoryReply({
        ...request,
        projectName: null,
        nonGithubRepoUrls: ['https://git.dpdk.org/dpdk'],
      }),
    ).toContain('*git.dpdk.org/dpdk* is on git.dpdk.org.')
  })

  it('explains it does not open web pages when only links to follow were found', () => {
    const reply = buildBotNoRepositoryReply({
      ...request,
      linksToFollow: ['https://wiki.lfnetworking.org/display/LN/Projects'],
    })

    expect(reply).toContain("I don't open web pages")
    expect(reply).toContain('onboard Purgatoria github.com/org/repo')
  })

  it('asks for the missing link, keeping the project name when known', () => {
    expect(buildBotNoRepositoryReply(request)).toBe(
      [
        'I need at least one GitHub link to add *Purgatoria*.',
        'Reply here mentioning me with the links, for example: @LFX Onboarding onboard Purgatoria github.com/org/repo',
      ].join('\n'),
    )
    expect(buildBotNoRepositoryReply(null)).toContain(
      'I need at least one GitHub link to add this project.',
    )
  })
})

describe('buildBotQueuedReply', () => {
  const queued = ['https://github.com/acme/two']
  const alreadyCatalogued = ['https://github.com/acme/one']

  it('lists checking and already requested repositories and promises a result', () => {
    expect(buildBotQueuedReply({ queued, alreadyCatalogued }, true)).toBe(
      [
        '⏳ Checking *<https://github.com/acme/two|acme/two>*…',
        "📘 *<https://github.com/acme/one|acme/one>* was already requested, I won't queue it again.",
        "I'll post the result for each repo in this thread.",
      ].join('\n'),
    )
  })

  it('warns when the check could not start right away', () => {
    const reply = buildBotQueuedReply({ queued, alreadyCatalogued: [] }, false)

    expect(reply).toContain('next scheduled evaluation')
    expect(reply).not.toContain("I'll post the result for each repo")
  })

  it('does not promise a result when nothing was queued', () => {
    expect(buildBotQueuedReply({ queued: [], alreadyCatalogued }, true)).not.toContain(
      'post the result',
    )
  })
})

describe('buildBotFailureReply', () => {
  it('asks to retry or to reach the CDP team', () => {
    expect(buildBotFailureReply()).toContain('try again in a minute')
  })
})
