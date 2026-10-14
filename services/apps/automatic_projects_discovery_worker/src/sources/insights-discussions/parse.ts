import { extractGithubRepoUrls } from '@crowd/common'

export interface IDiscussionRefs {
  repoUrls: string[]
  fromTitle: number
  fromBody: number
}

const FENCED_CODE_BLOCK_RE = /(```|~~~)[\s\S]*?\1/g
const HTML_COMMENT_RE = /<!--[\s\S]*?-->/g
const BLOCKQUOTE_LINE_RE = /^[ \t]*>.*$/gm

// A link quoted in a code block, HTML comment, or blockquote is context, not a request.
// Inline code is not stripped: users routinely backtick links to format them.
export function stripNonProseSections(markdown: string): string {
  let stripped = markdown
  let previous: string
  do {
    previous = stripped
    stripped = stripped.replace(HTML_COMMENT_RE, '')
  } while (stripped !== previous)

  return stripped.replace(FENCED_CODE_BLOCK_RE, '').replace(BLOCKQUOTE_LINE_RE, '')
}

export function extractDiscussionRepoUrls(discussion: {
  title: string
  body: string
}): IDiscussionRefs {
  const fromTitleUrls = extractGithubRepoUrls(discussion.title)
  const fromBodyUrls = extractGithubRepoUrls(stripNonProseSections(discussion.body))

  const seen = new Set<string>()
  const repoUrls: string[] = []
  for (const url of [...fromTitleUrls, ...fromBodyUrls]) {
    if (seen.has(url)) continue
    seen.add(url)
    repoUrls.push(url)
  }

  return {
    repoUrls,
    fromTitle: fromTitleUrls.length,
    fromBody: fromBodyUrls.length,
  }
}

export function buildDiscussionRequestText(discussion: { title: string; body: string }): string {
  return `${discussion.title}\n\n${stripNonProseSections(discussion.body)}`
}
