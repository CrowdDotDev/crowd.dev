import {
  MAX_REQUEST_TEXT_LENGTH,
  canonicalizeRepoUrl,
  extractGithubRepoRefs,
  stripTrailingPunctuation,
} from '@crowd/common'
import { ITrackedRepoProject } from '@crowd/data-access-layer'
import {
  IDbProjectCatalog,
  isSlackPermalink,
} from '@crowd/data-access-layer/src/project-catalog/types'
import {
  ISlackMessageContent,
  MAX_BLOCKS_PER_MESSAGE,
  escapeSlackText,
  linkButtonBlocks,
  mrkdwnSections,
} from '@crowd/slack'

import { BotStatus, INSIGHTS_PROJECT_URL_BASE, STATUS, repoLabel } from './botCopy'
import { formatReason } from './botThreadReply'
import { IParsedOnboardingRequest } from './requestParser'

const BOT_MENTION = '@LFX Onboarding'
const EXAMPLE_REQUEST = `${BOT_MENTION} onboard Envoy, LF project, github.com/envoyproxy/xds github.com/envoyproxy/go-control-plane`
const PROJECT_PLACEHOLDER = escapeSlackText('<project>')
const REPO_PLACEHOLDER = 'github.com/org/repo'

export const VIEW_INSIGHTS_PROJECT_ACTION_ID = 'view_insights_project'

export type IngestReplyRequest = Pick<
  IParsedOnboardingRequest,
  'projectName' | 'declaredLf' | 'githubRepoUrls' | 'nonGithubRepoUrls' | 'linksToFollow'
>

export type IAlreadyRequestedRow = Pick<
  IDbProjectCatalog,
  'repoUrl' | 'action' | 'skipReason' | 'sourceUrl'
>

export interface IIngestOutcome {
  queued: string[]
  alreadyRequested: IAlreadyRequestedRow[]
  alreadyTracked: ITrackedRepoProject[]
  notes: string[]
}

export interface IIngestNotesInput {
  requestText: string
  repoUrls: string[]
  nonGithubRepoUrls: string[] | null
  truncated: boolean
}

const BUTTONS_PER_BLOCK = 5

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

const TRUNCATION_NOTE = `Your message was long, so I only read the first ${MAX_REQUEST_TEXT_LENGTH.toLocaleString('en-US')} characters.`

function timesWord(count: number): string {
  return count === 2 ? 'twice' : `${count} times`
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

function noRepositoryReply(request: IngestReplyRequest | null): string {
  if (request?.nonGithubRepoUrls.length) {
    return buildBotUnsupportedHostReply(request)
  }
  if (request?.linksToFollow.length) {
    return buildBotWebPageOnlyReply(request)
  }
  return buildBotMissingLinkReply(request)
}

export function buildBotNoRepositoryReply(
  request: IngestReplyRequest | null,
  { truncated = false, requestText = '' }: { truncated?: boolean; requestText?: string } = {},
): string {
  const text = noRepositoryReply(request ?? fallbackRequest(requestText))
  return truncated ? reply(text, TRUNCATION_NOTE) : text
}

const HOST_WITH_TLD = /\.[a-z]{2,}$/i

function looksLikeExternalLink(token: string): boolean {
  const canonical = canonicalizeRepoUrl(token)
  return canonical !== null && !canonical.isGithub && HOST_WITH_TLD.test(canonical.host)
}

function stripAngleBrackets(token: string): string {
  let start = 0
  let end = token.length
  while (start < end && token[start] === '<') {
    start += 1
  }
  while (end > start && token[end - 1] === '>') {
    end -= 1
  }
  return token.slice(start, end)
}

function nonGithubLinks(requestText: string): string[] {
  const tokens = requestText
    .split(/\s+/)
    .map((token) => stripTrailingPunctuation(stripAngleBrackets(token)))
  return [...new Set(tokens.filter(looksLikeExternalLink))]
}

function fallbackRequest(requestText: string): IngestReplyRequest | null {
  const nonGithubRepoUrls = nonGithubLinks(requestText)
  return nonGithubRepoUrls.length > 0
    ? {
        projectName: null,
        declaredLf: null,
        githubRepoUrls: [],
        nonGithubRepoUrls,
        linksToFollow: [],
      }
    : null
}

export function collectIngestNotes({
  requestText,
  repoUrls,
  nonGithubRepoUrls,
  truncated,
}: IIngestNotesInput): string[] {
  const refs = extractGithubRepoRefs(requestText)
  const notes: string[] = []

  for (const repoUrl of repoUrls) {
    const mentions = refs.filter((ref) => ref.url === repoUrl)
    if (mentions.length > 1) {
      notes.push(
        `You sent ${repoLabel(repoUrl)} ${timesWord(mentions.length)}, I'm handling it once.`,
      )
    }
    if (mentions.some((ref) => ref.deepLink)) {
      notes.push(
        `You linked a page inside ${repoLabel(repoUrl)} (a folder, file, issue or pull request). I work with whole repositories, so I'm looking at the repository itself.`,
      )
    }
  }

  for (const url of nonGithubRepoUrls ?? nonGithubLinks(requestText)) {
    notes.push(
      `Skipped ${escapeSlackText(withoutScheme(url))}: only GitHub repositories can be added.`,
    )
  }

  if (truncated) {
    notes.push(TRUNCATION_NOTE)
  }

  return notes
}

export function alreadyRequestedStatus(row: Pick<IDbProjectCatalog, 'action'>): BotStatus {
  switch (row.action) {
    case 'review':
      return 'withTeam'
    case 'skip':
      return 'notAdded'
    case 'onboarded':
      return 'added'
    case 'unsure':
    case 'error':
      return 'problem'
    default:
      return 'checking'
  }
}

function alreadyRequestedLine(row: IAlreadyRequestedRow): string {
  const linked = !!row.sourceUrl && isSlackPermalink(row.sourceUrl)
  const where = linked ? `<${row.sourceUrl}|here>` : 'earlier'
  const resultLine = linked
    ? "You'll get the result in that thread."
    : row.sourceUrl
      ? 'The CDP team follows it up.'
      : "You'll get the result in this thread."
  const dispute = linked
    ? 'Reply in that thread if this looks wrong, or ask the CDP team in this channel.'
    : 'Ask the CDP team in this channel if this looks wrong.'
  const repo = repoLabel(row.repoUrl)
  switch (alreadyRequestedStatus(row)) {
    case 'withTeam':
      return `${STATUS.withTeam} ${repo} was already requested ${where} and is with the CDP team. ${resultLine}`
    case 'notAdded':
      return `${STATUS.notAdded} ${repo} was already requested ${where} and wasn't added: ${formatReason(row.skipReason ?? 'no reason was recorded')}. ${dispute}`
    case 'added':
      return `${STATUS.added} ${repo} was already requested ${where} and is now in LFX Insights.`
    case 'problem':
      return `${STATUS.problem} ${repo} was already requested ${where}, but something went wrong on our side. The CDP team is on it.`
    default:
      return `${STATUS.checking} ${repo} was already requested ${where} and is still being checked. ${resultLine}`
  }
}

function alreadyTrackedLine(project: ITrackedRepoProject): string {
  return `${STATUS.alreadyThere} ${repoLabel(project.repoUrl)} is already in LFX Insights under *${escapeSlackText(project.projectName)}*. Nothing else to do.`
}

function closingLine(evaluationStarted: boolean): string {
  return evaluationStarted
    ? "I'll post the result for each repo in this thread."
    : `${STATUS.problem} I couldn't start the check right now, it will run with the next scheduled evaluation. I'll post the result here.`
}

function insightsButtons(alreadyTracked: ITrackedRepoProject[]) {
  return alreadyTracked
    .filter(
      (project): project is ITrackedRepoProject & { projectSlug: string } => !!project.projectSlug,
    )
    .map((project, index) => ({
      text: `View ${project.projectName} in LFX Insights`,
      url: `${INSIGHTS_PROJECT_URL_BASE}/${project.projectSlug}`,
      actionId: `${VIEW_INSIGHTS_PROJECT_ACTION_ID}:${index}`,
    }))
}

export function buildBotIngestReply(
  { queued, alreadyRequested, alreadyTracked, notes }: IIngestOutcome,
  evaluationStarted: boolean,
): ISlackMessageContent {
  const lines = [
    ...alreadyTracked.map(alreadyTrackedLine),
    ...queued.map((repoUrl) => `${STATUS.checking} Checking ${repoLabel(repoUrl)}…`),
    ...alreadyRequested.map(alreadyRequestedLine),
    ...notes,
  ]
  if (queued.length > 0) {
    lines.push(closingLine(evaluationStarted))
  }

  const text = reply(...lines)
  const buttons = insightsButtons(alreadyTracked)
  if (buttons.length === 0) {
    return { text }
  }
  const sections = mrkdwnSections(text).slice(0, MAX_BLOCKS_PER_MESSAGE)
  const buttonBudget = Math.max(0, MAX_BLOCKS_PER_MESSAGE - sections.length) * BUTTONS_PER_BLOCK
  return { text, blocks: [...sections, ...linkButtonBlocks(buttons.slice(0, buttonBudget))] }
}

export function buildBotFailureReply(): string {
  return `${STATUS.problem} I couldn't record this request. Please try again in a minute, or ask the CDP team in this channel.`
}
