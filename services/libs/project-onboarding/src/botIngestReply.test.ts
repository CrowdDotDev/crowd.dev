import { describe, expect, it } from 'vitest'

import {
  IAlreadyRequestedRow,
  IngestReplyRequest,
  buildBotFailureReply,
  buildBotHelpReply,
  buildBotHierarchyQuestionReply,
  buildBotIngestReply,
  buildBotNoRepositoryReply,
  collectIngestNotes,
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

  it('names the unsupported host from the text when the parser is unavailable', () => {
    expect(
      buildBotNoRepositoryReply(null, {
        requestText: 'onboard libxml2 gitlab.gnome.org/GNOME/libxml2',
      }),
    ).toContain('*gitlab.gnome.org/GNOME/libxml2* is on GitLab.')
  })

  it('mentions the truncation when a long message had no usable link', () => {
    expect(buildBotNoRepositoryReply(request, { truncated: true })).toContain(
      'I only read the first 10,000 characters.',
    )
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

describe('buildBotIngestReply', () => {
  const queued = ['https://github.com/acme/two']
  const tracked = {
    repoUrl: 'https://github.com/acme/core',
    projectName: 'Acme <Core>',
    projectSlug: 'acme-core',
  }
  const requested: IAlreadyRequestedRow = {
    repoUrl: 'https://github.com/acme/one',
    action: 'review',
    skipReason: null,
    reviewedBy: null,
    decisionReason: null,
    sourceUrl: 'https://acme.slack.com/archives/C1/p1760000000123456',
  }

  it('lists checking repositories, says where an earlier request stands and promises a result', () => {
    expect(
      buildBotIngestReply(
        { queued, alreadyRequested: [requested], alreadyTracked: [], notes: [] },
        true,
      ),
    ).toEqual({
      text: [
        '⏳ Checking *<https://github.com/acme/two|acme/two>*…',
        "👀 *<https://github.com/acme/one|acme/one>* was already requested <https://acme.slack.com/archives/C1/p1760000000123456|here> and is with the CDP team. You'll get the result in that thread.",
        "I'll update this message as each repo is checked.",
      ].join('\n'),
    })
  })

  it('describes every state of an earlier request', () => {
    const line = (row: Partial<IAlreadyRequestedRow>) =>
      buildBotIngestReply(
        { queued: [], alreadyRequested: [{ ...requested, ...row }], alreadyTracked: [], notes: [] },
        true,
      ).text

    expect(line({ action: 'evaluate' })).toContain('is still being checked')
    expect(line({ action: 'skip', skipReason: 'it is already in LFX Insights.' })).toBe(
      "🚫 *<https://github.com/acme/one|acme/one>* was already requested <https://acme.slack.com/archives/C1/p1760000000123456|here> and wasn't added: it is already in LFX Insights. Reply in that thread if this looks wrong, or ask the CDP team in this channel.",
    )
    expect(
      line({ action: 'skip', skipReason: 'rejected in review by U123', reviewedBy: 'U123' }),
    ).toContain("wasn't added: <@U123> reviewed it and rejected the request.")
    expect(
      line({ action: 'skip', skipReason: 'the Insights project was deleted', reviewedBy: 'U123' }),
    ).toContain("wasn't added: the Insights project was deleted.")
    expect(
      line({
        action: 'skip',
        skipReason: 'rejected in review by U123',
        reviewedBy: 'U123',
        decisionReason: 'wrong_project',
      }),
    ).toContain("wasn't added: <@U123> reviewed it: Wrong project.")
    expect(line({ action: 'onboarded' })).toContain('is now in LFX Insights')
    expect(line({ action: 'unsure' })).toContain('something went wrong on our side')
    expect(
      line({ action: 'auto', sourceUrl: 'https://github.com/org/repo/discussions/1' }),
    ).toContain(
      'was already requested <https://github.com/org/repo/discussions/1|here> and is still being checked. The CDP team follows it up from there.',
    )
    expect(line({ action: 'auto', sourceUrl: null })).toContain(
      "was already requested earlier and is still being checked. You'll get the result in this thread.",
    )
    expect(
      line({
        action: 'skip',
        skipReason: 'only GitHub repositories can be added',
        sourceUrl: null,
      }),
    ).toContain(
      "wasn't added: only GitHub repositories can be added. Ask the CDP team in this channel if this looks wrong.",
    )
  })

  it('reports tracked repositories as a success with a link button to the project', () => {
    const message = buildBotIngestReply(
      { queued: [], alreadyRequested: [], alreadyTracked: [tracked], notes: [] },
      true,
    )

    expect(message.text).toBe(
      '📘 *<https://github.com/acme/core|acme/core>* is already in LFX Insights under *Acme &lt;Core&gt;*. Nothing else to do.',
    )
    expect(message.blocks).toHaveLength(2)
    expect(JSON.stringify(message.blocks)).toContain(
      '"url":"https://insights.linuxfoundation.org/project/acme-core"',
    )
    expect(JSON.stringify(message.blocks)).toContain('View Acme <Core> in LFX Insights')
    expect(JSON.stringify(message.blocks)).toContain('"action_id":"view_insights_project:0"')
  })

  it('renders one button per tracked project, five per actions block, and splits long text into sections', () => {
    const alreadyTracked = Array.from({ length: 7 }, (_, index) => ({
      repoUrl: `https://github.com/acme/repo-${index}`,
      projectName: `Project ${index} ${'x'.repeat(600)}`,
      projectSlug: `project-${index}`,
    }))

    const message = buildBotIngestReply(
      { queued: [], alreadyRequested: [], alreadyTracked, notes: [] },
      true,
    )

    const sections = message.blocks?.filter((block) => block.type === 'section') ?? []
    const actions = message.blocks?.filter((block) => block.type === 'actions') ?? []
    expect(sections.length).toBeGreaterThan(1)
    expect(actions.map((block) => (block.type === 'actions' ? block.elements.length : 0))).toEqual([
      5, 2,
    ])
    expect(JSON.stringify(message.blocks)).toContain('"action_id":"view_insights_project:6"')
  })

  it('skips the button when the project has no slug and keeps the notes before the closing line', () => {
    const message = buildBotIngestReply(
      {
        queued,
        alreadyRequested: [],
        alreadyTracked: [{ ...tracked, projectSlug: null }],
        notes: ['Skipped gitlab.com/acme/x: only GitHub repositories can be added.'],
      },
      false,
    )

    expect(message.blocks).toBeUndefined()
    expect(message.text.split('\n')).toEqual([
      '📘 *<https://github.com/acme/core|acme/core>* is already in LFX Insights under *Acme &lt;Core&gt;*. Nothing else to do.',
      '⏳ Checking *<https://github.com/acme/two|acme/two>*…',
      'Skipped gitlab.com/acme/x: only GitHub repositories can be added.',
      "⚠️ I couldn't start the check right now, it will run with the next scheduled evaluation. I'll update this message as each repo is checked.",
    ])
  })
})

describe('collectIngestNotes', () => {
  it('explains duplicates, folder links, skipped hosts and truncation', () => {
    expect(
      collectIngestNotes({
        requestText:
          'onboard https://github.com/acme/two/tree/main/docs and https://github.com/acme/two and gitlab.com/acme/x',
        repoUrls: ['https://github.com/acme/two'],
        nonGithubRepoUrls: ['https://gitlab.com/acme/x'],
        truncated: true,
      }),
    ).toEqual([
      "You sent *<https://github.com/acme/two|acme/two>* twice, I'm handling it once.",
      "You linked a page inside *<https://github.com/acme/two|acme/two>* (a folder, file, issue or pull request). I work with whole repositories, so I'm looking at the repository itself.",
      'Skipped gitlab.com/acme/x: only GitHub repositories can be added.',
      'Your message was long, so I only read the first 10,000 characters.',
    ])
  })

  it('derives the skipped non-GitHub links from the text when the parser is unavailable', () => {
    expect(
      collectIngestNotes({
        requestText:
          'onboard https://github.com/acme/two and gitlab.com/acme/x, see https://acme.org/docs; not acme/tool or v1.2/notes',
        repoUrls: ['https://github.com/acme/two'],
        nonGithubRepoUrls: null,
        truncated: false,
      }),
    ).toEqual([
      'Skipped gitlab.com/acme/x: only GitHub repositories can be added.',
      'Skipped acme.org/docs: only GitHub repositories can be added.',
    ])
  })

  it('keeps the whole message under the Slack block limit', () => {
    const alreadyTracked = Array.from({ length: 300 }, (_, index) => ({
      repoUrl: `https://github.com/acme/repo-${index}`,
      projectName: `Project ${index}`,
      projectSlug: `project-${index}`,
    }))

    const message = buildBotIngestReply(
      { queued: [], alreadyRequested: [], alreadyTracked, notes: [] },
      true,
    )

    expect(message.blocks?.length).toBeLessThanOrEqual(50)
  })

  it('says nothing for a plain single link', () => {
    expect(
      collectIngestNotes({
        requestText: 'onboard https://github.com/acme/two',
        repoUrls: ['https://github.com/acme/two'],
        nonGithubRepoUrls: [],
        truncated: false,
      }),
    ).toEqual([])
  })
})

describe('buildBotFailureReply', () => {
  it('asks to retry or to reach the CDP team', () => {
    expect(buildBotFailureReply()).toContain('try again in a minute')
  })
})
