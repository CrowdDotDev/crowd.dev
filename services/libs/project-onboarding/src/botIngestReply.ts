import { canonicalizeRepoUrl } from '@crowd/common'
import { escapeSlackText } from '@crowd/slack'

import { STATUS, repoLabel } from './botCopy'
import { IParsedOnboardingRequest } from './requestParser'

const BOT_MENTION = '@LFX Onboarding'
const EXAMPLE_REQUEST = `${BOT_MENTION} onboard Envoy, LF project, github.com/envoyproxy/xds github.com/envoyproxy/go-control-plane`
const PROJECT_PLACEHOLDER = escapeSlackText('<project>')
const REPO_PLACEHOLDER = 'github.com/org/repo'

export type IngestReplyRequest = Pick<
  IParsedOnboardingRequest,
  'projectName' | 'declaredLf' | 'githubRepoUrls' | 'nonGithubRepoUrls' | 'linksToFollow'
>

export interface IQueuedRepositories {
  queued: string[]
  alreadyCatalogued: string[]
}

function reply(...lines: string[]): string {
  return lines.join('\n')
}

function withoutScheme(url: string): string {
  return url.replace(/^https?:\/\//, '')
}

function describeHost(host: string): string {
  return host.includes('gitlab') ? 'GitLab' : host
}

function lfDeclaration(declaredLf: boolean | null): string {
  if (declaredLf === true) {
    return ', LF project,'
  }
  return declaredLf === false ? ', not an LF project,' : ''
}

function requestExample(request: IngestReplyRequest | null, repo = REPO_PLACEHOLDER): string {
  const project = request?.projectName ? escapeSlackText(request.projectName) : PROJECT_PLACEHOLDER
  const declaration = lfDeclaration(request?.declaredLf ?? null)
  return `${BOT_MENTION} onboard ${project}${declaration} ${escapeSlackText(repo)}`
}

export function buildBotHelpReply(): string {
  return reply(
    'Hi! I add GitHub repositories to LFX Insights.',
    '*Mention me with:*',
    '1. the project name',
    "2. whether it's a Linux Foundation project",
    '3. one or more GitHub repository links',
    `*Example*\n\`${EXAMPLE_REQUEST}\``,
    "Only GitHub links work for now. I'll reply in this thread with the result for each repo.",
  )
}

export function buildBotHierarchyQuestionReply(request: IngestReplyRequest): string {
  const subject = request.projectName ? `*${escapeSlackText(request.projectName)}*` : 'this project'
  const repo = request.githubRepoUrls[0]
    ? withoutScheme(request.githubRepoUrls[0])
    : REPO_PLACEHOLDER
  return reply(
    `That's a question about which foundation ${subject} belongs to, and I can't decide that. I only add repositories to LFX Insights.`,
    `If you want it added, send: ${requestExample(request, repo)}`,
  )
}

export function buildBotUnsupportedHostReply(request: IngestReplyRequest): string {
  const url = request.nonGithubRepoUrls[0]
  const canonical = canonicalizeRepoUrl(url)
  const shown = escapeSlackText(withoutScheme(canonical?.url ?? url))
  const host = describeHost(canonical?.host ?? 'another host')
  const project = request.projectName ? escapeSlackText(request.projectName) : 'the project'
  return reply(
    `${STATUS.notAdded} I can only add *GitHub* repositories, and *${shown}* is on ${host}.`,
    `If ${project} has a GitHub mirror, send me that link. Otherwise ask the CDP team in this channel to connect it by hand.`,
  )
}

export function buildBotWebPageOnlyReply(request: IngestReplyRequest): string {
  return reply(
    "I don't open web pages, so I can't read the repositories listed there.",
    `Reply here mentioning me with the GitHub links themselves, for example: ${requestExample(request)}`,
  )
}

export function buildBotMissingLinkReply(request: IngestReplyRequest | null): string {
  const target = request?.projectName ? `*${escapeSlackText(request.projectName)}*` : 'this project'
  return reply(
    `I need at least one GitHub link to add ${target}.`,
    `Reply here mentioning me with the links, for example: ${requestExample(request)}`,
  )
}

export function buildBotNoRepositoryReply(request: IngestReplyRequest | null): string {
  if (request?.nonGithubRepoUrls.length) {
    return buildBotUnsupportedHostReply(request)
  }
  if (request?.linksToFollow.length) {
    return buildBotWebPageOnlyReply(request)
  }
  return buildBotMissingLinkReply(request)
}

export function buildBotQueuedReply(
  { queued, alreadyCatalogued }: IQueuedRepositories,
  evaluationStarted: boolean,
): string {
  const lines = [
    ...queued.map((repoUrl) => `${STATUS.checking} Checking ${repoLabel(repoUrl)}…`),
    ...alreadyCatalogued.map(
      (repoUrl) =>
        `${STATUS.alreadyThere} ${repoLabel(repoUrl)} was already requested, I won't queue it again.`,
    ),
  ]

  if (queued.length > 0) {
    lines.push(
      evaluationStarted
        ? "I'll post the result for each repo in this thread."
        : `${STATUS.problem} I couldn't start the check right now, it will run with the next scheduled evaluation. I'll post the result here.`,
    )
  }

  return reply(...lines)
}

export function buildBotFailureReply(): string {
  return `${STATUS.problem} I couldn't record this request. Please try again in a minute, or ask the CDP team in this channel.`
}
