export type ICanonicalRepoUrl =
  | { url: string; host: string; isGithub: true; owner: string; repo: string }
  | { url: string; host: string; isGithub: false; owner: null; repo: null }

const GITHUB_HOST = 'github.com'

// Owners that are GitHub product surfaces, not repo owners — a link to any of
// these is never a repo reference even though it matches /github.com/{a}/{b}/.
const GITHUB_NON_REPO_OWNERS = new Set([
  'user-attachments',
  'orgs',
  'apps',
  'marketplace',
  'sponsors',
  'topics',
  'collections',
  'settings',
  'login',
  'about',
  'features',
  'search',
  'explore',
  'pricing',
  'notifications',
  'trending',
  'enterprise',
  'security',
  'organizations',
  'dashboard',
  'issues',
  'pulls',
  'new',
])

function toParsableUrl(raw: string): string {
  const trimmed = raw.trim()
  const sshRewritten = trimmed
    // scp-style path wrapped in an ssh:// scheme, e.g. ssh://git@host:owner/repo.git —
    // left alone when followed by digits/ (an actual port, e.g. ssh://git@host:2222/owner/repo.git).
    .replace(/^ssh:\/\/git@([a-zA-Z0-9.-]+):(?!\d+(?:\/|$))/, 'https://$1/')
    .replace(/^ssh:\/\/git@([a-zA-Z0-9.-]+)\//, 'https://$1/')
    .replace(/^git@([a-zA-Z0-9.-]+):/, 'https://$1/')

  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(sshRewritten)
    ? sshRewritten
    : `https://${sshRewritten}`
}

function stripSlashesAndGitSuffix(pathname: string): string {
  return pathname
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/\.git$/i, '')
}

export function canonicalizeRepoUrl(raw: string | null | undefined): ICanonicalRepoUrl | null {
  if (!raw || typeof raw !== 'string') {
    return null
  }

  let parsed: URL
  try {
    parsed = new URL(toParsableUrl(raw))
  } catch {
    return null
  }

  const lowerHost = parsed.hostname.toLowerCase()
  const host = lowerHost === `www.${GITHUB_HOST}` ? GITHUB_HOST : lowerHost
  if (!host) {
    return null
  }

  const path = stripSlashesAndGitSuffix(parsed.pathname)
  if (!path) {
    return null
  }

  if (host === GITHUB_HOST) {
    // Deep links (/tree/<branch>, /blob/<branch>/<path>, ...) still unambiguously
    // reference the repo at the first two segments — take those instead of rejecting.
    const segments = path.split('/')
    if (segments.length < 2 || !segments[0] || !segments[1]) {
      return null
    }

    const owner = segments[0].toLowerCase()
    const repo = segments[1].toLowerCase().replace(/\.git$/i, '')
    if (GITHUB_NON_REPO_OWNERS.has(owner)) {
      return null
    }

    return {
      url: `https://${GITHUB_HOST}/${owner}/${repo}`,
      host: GITHUB_HOST,
      isGithub: true,
      owner,
      repo,
    }
  }

  // Non-GitHub hosts keep path case and explicit port — case-sensitive upstreams,
  // and distinct ports can mean distinct servers.
  const authority = parsed.port ? `${host}:${parsed.port}` : host
  return {
    url: `https://${authority}/${path}`,
    host,
    isGithub: false,
    owner: null,
    repo: null,
  }
}

export function githubOrganizationOwner(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') {
    return null
  }

  let parsed: URL
  try {
    parsed = new URL(toParsableUrl(raw))
  } catch {
    return null
  }

  const host = parsed.hostname.toLowerCase()
  if (host !== GITHUB_HOST && host !== `www.${GITHUB_HOST}`) {
    return null
  }

  const segments = stripSlashesAndGitSuffix(parsed.pathname).split('/').filter(Boolean)
  const owner =
    segments.length === 1
      ? segments[0]
      : segments.length === 2 && segments[0] === 'orgs'
        ? segments[1]
        : null
  return owner && !GITHUB_NON_REPO_OWNERS.has(owner.toLowerCase()) ? owner : null
}

const LEADING_WRAPPERS = new Set(['<', '(', '[', '"', "'"])

function stripLeadingWrappers(text: string): string {
  let start = 0
  while (start < text.length && LEADING_WRAPPERS.has(text[start])) {
    start++
  }
  return text.slice(start)
}

export function extractGithubOrganizations(text: string): string[] {
  const owners = text
    .split(/\s+/)
    .filter((token) => token.toLowerCase().includes(GITHUB_HOST))
    .map((token) => githubOrganizationOwner(stripTrailingPunctuation(stripLeadingWrappers(token))))
    .filter((owner): owner is string => owner !== null)
    .map((owner) => owner.toLowerCase())
  return [...new Set(owners)]
}

export function canonicalizeGithubRepoUrl(raw: string | null | undefined): string | null {
  const canonical = canonicalizeRepoUrl(raw)
  return canonical?.isGithub ? canonical.url : null
}

export function githubRepoPath(raw: string | null | undefined): string | null {
  const canonical = canonicalizeRepoUrl(raw)
  return canonical?.isGithub ? `${canonical.owner}/${canonical.repo}` : null
}

const TRAILING_PUNCTUATION = new Set(['.', ',', ';', ':', '!', '?', ')', '>', "'", '"', ']'])

export function stripTrailingPunctuation(text: string): string {
  let end = text.length
  while (end > 0 && TRAILING_PUNCTUATION.has(text[end - 1])) {
    end--
  }
  return text.slice(0, end)
}

// Excludes gist.github.com, lookalike hosts (e.g. mygithub.com) and paths of other URLs
// (e.g. example.com/github.com/x/y), which would otherwise become a fabricated github.com URL.
const GITHUB_REPO_REF_RE =
  /(?<![a-zA-Z0-9.\-/])(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)((?:\/[a-zA-Z0-9_.\-/]*)?)/gi

export interface IGithubRepoRef {
  url: string
  deepLink: boolean
}

export function extractGithubRepoRefs(text: string): IGithubRepoRef[] {
  const refs: IGithubRepoRef[] = []

  for (const match of text.matchAll(GITHUB_REPO_REF_RE)) {
    const owner = match[1]
    const repo = stripTrailingPunctuation(match[2])
    if (!repo) continue

    const rest = stripTrailingPunctuation(match[3] ?? '')
    const canonical = canonicalizeGithubRepoUrl(`https://github.com/${owner}/${repo}${rest}`)
    if (!canonical) continue

    refs.push({ url: canonical, deepLink: rest.replace(/\/+$/, '').length > 0 })
  }

  return refs
}

export function extractGithubRepoUrls(text: string): string[] {
  return [...new Set(extractGithubRepoRefs(text).map((ref) => ref.url))]
}
