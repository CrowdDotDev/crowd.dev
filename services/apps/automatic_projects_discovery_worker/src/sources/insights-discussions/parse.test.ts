import { describe, expect, it } from 'vitest'

import {
  buildDiscussionRequestText,
  extractDiscussionRepoUrls,
  stripNonProseSections,
} from './parse'

describe('stripNonProseSections', () => {
  it('removes fenced code blocks', () => {
    expect(
      stripNonProseSections('before\n```\nhttps://github.com/foo/bar\n```\nafter'),
    ).not.toContain('github.com/foo/bar')
  })

  it('keeps inline code', () => {
    expect(stripNonProseSections('see `https://github.com/foo/bar` here')).toContain(
      'github.com/foo/bar',
    )
  })

  it('removes HTML comments', () => {
    expect(stripNonProseSections('<!-- https://github.com/foo/bar --> visible text')).not.toContain(
      'github.com/foo/bar',
    )
  })

  it('removes blockquote lines', () => {
    expect(stripNonProseSections('> https://github.com/foo/bar\nreal text')).not.toContain(
      'github.com/foo/bar',
    )
  })

  it('keeps prose text intact', () => {
    expect(stripNonProseSections('please onboard https://github.com/foo/bar')).toContain(
      'github.com/foo/bar',
    )
  })
})

describe('extractDiscussionRepoUrls', () => {
  it('extracts a reference that only appears in the title', () => {
    const result = extractDiscussionRepoUrls({
      title: 'github.com/agentnameservice/ans',
      body: 'Please onboard this project, thanks!',
    })

    expect(result.repoUrls).toEqual(['https://github.com/agentnameservice/ans'])
    expect(result.fromTitle).toBe(1)
    expect(result.fromBody).toBe(0)
  })

  it('scans the title before the body and dedupes across both', () => {
    const result = extractDiscussionRepoUrls({
      title: 'Onboard https://github.com/foo/bar',
      body: 'Same repo again: https://github.com/foo/bar',
    })

    expect(result.repoUrls).toEqual(['https://github.com/foo/bar'])
    expect(result.fromTitle).toBe(1)
    expect(result.fromBody).toBe(1)
  })

  it('strips quoted/code references from the body but keeps prose ones', () => {
    const result = extractDiscussionRepoUrls({
      title: 'Onboard request',
      body: '> quoted mention of https://github.com/quoted/repo\nPlease onboard https://github.com/real/repo',
    })

    expect(result.repoUrls).toEqual(['https://github.com/real/repo'])
  })

  it('keeps all six references when several repos of the same discussion survive', () => {
    const repos = [
      'cockpit-project/cockpit',
      'cockpit-project/cockpit-machines',
      'cockpit-project/cockpit-podman',
      'cockpit-project/cockpit-ostree',
      'cockpit-project/cockpit-files',
      'cockpit-project/cockpit-navigator',
    ]
    const body = repos.map((r) => `https://github.com/${r}`).join('\n')

    const result = extractDiscussionRepoUrls({ title: 'Onboard the Cockpit project', body })

    expect(result.repoUrls).toEqual(repos.map((r) => `https://github.com/${r}`))
  })

  it('returns no candidates for a discussion with no repo references', () => {
    const result = extractDiscussionRepoUrls({
      title: 'Garden Linux: Organization vs Project',
      body: 'https://github.com/gardenlinux',
    })

    expect(result.repoUrls).toEqual([])
  })

  it('extracts a repo link wrapped in inline code (#2302)', () => {
    const result = extractDiscussionRepoUrls({
      title: 'Add reShapr to LFX Insights',
      body: '* **Repository:** `https://github.com/reshaprio/reshapr`',
    })

    expect(result.repoUrls).toEqual(['https://github.com/reshaprio/reshapr'])
  })
})

describe('buildDiscussionRequestText', () => {
  it('joins the title with the prose of the body', () => {
    expect(
      buildDiscussionRequestText({
        title: 'Onboard Acme',
        body: 'Repo: https://github.com/acme/one',
      }),
    ).toBe('Onboard Acme\n\nRepo: https://github.com/acme/one')
  })

  it('leaves out code blocks, comments and quotes from the body', () => {
    const body = [
      'Real request for Acme',
      '<!-- project: Hidden -->',
      '> project: Quoted',
      '```',
      'project: Fenced',
      '```',
    ].join('\n')

    const text = buildDiscussionRequestText({ title: 'Title', body })

    expect(text).toContain('Real request for Acme')
    expect(text).not.toMatch(/Hidden|Quoted|Fenced/)
  })
})
