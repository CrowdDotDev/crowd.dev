import {
  MAX_REQUEST_TEXT_LENGTH,
  extractGithubRepoUrls,
  getErrorMessage,
  truncateRequestText,
} from '@crowd/common'
import {
  bulkInsertProjectCatalog,
  deriveProjectIdentityFromRepoUrl,
  findExistingProjectCatalogRepoUrls,
  findProjectCatalogByRepoUrls,
  findTrackedRepoProjects,
  promoteProjectCatalogProvenance,
} from '@crowd/data-access-layer'
import {
  IDbProjectCatalog,
  IDbProjectCatalogCreate,
} from '@crowd/data-access-layer/src/project-catalog/types'
import type { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import {
  BotStatus,
  IParsedOnboardingRequest,
  STATUS_REACTION,
  alreadyRequestedStatus,
  buildBotFailureReply,
  buildBotHelpReply,
  buildBotHierarchyQuestionReply,
  buildBotIngestReply,
  buildBotNoRepositoryReply,
  collectIngestNotes,
  parseOnboardingRequest,
} from '@crowd/project-onboarding'
import { createOnboardingRequestLlm } from '@crowd/project-onboarding/src/requestLlm'
import {
  ISlackMessageContent,
  addSlackReaction,
  getSlackPermalink,
  postSlackMessage,
} from '@crowd/slack'
import { type Client as TemporalClient, WorkflowIdReusePolicy } from '@crowd/temporal'

import { createDailyLlmCap } from '../../api/public/v1/projectEvaluation/dailyLlmCap'
import { IServiceOptions } from '../IServiceOptions'
import { getBgQx } from './slackBackground'

const MENTION_PATTERN = /<@[A-Z0-9]+>/g
const LINK_WITH_LABEL_PATTERN = /<(https?:\/\/[^|>\s]+)\|[^>]*>/g
const LINK_PATTERN = /<(https?:\/\/[^>\s]+)>/g
const HELP_KEYWORD = 'help'

const reserveDailyLlmCall = createDailyLlmCap()

export interface IOnboardingRequestIngest {
  requestText: string
  repoUrls: string[]
  sourceUrl: string
  projectName: string | null
}

export interface IOnboardingRequestIngestResult {
  queued: string[]
  queuedIds: string[]
  alreadyCatalogued: string[]
}

export interface IOnboardingRequestEvaluation {
  channelId: string
  messageTs: string
  catalogIds: string[]
}

export type OnboardingRequestTemporal = Pick<TemporalClient, 'workflow'>

type RequestLog = Pick<IServiceOptions, 'log'>['log']

export function toRequestText(slackText: string): string {
  return slackText
    .replace(MENTION_PATTERN, '')
    .replace(LINK_WITH_LABEL_PATTERN, '$1')
    .replace(LINK_PATTERN, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()
}

function isHelpRequest(requestText: string): boolean {
  return requestText.toLowerCase() === HELP_KEYWORD
}

function toCatalogRow(
  repoUrl: string,
  { requestText, sourceUrl, projectName }: Omit<IOnboardingRequestIngest, 'repoUrls'>,
): IDbProjectCatalogCreate | null {
  const identity = deriveProjectIdentityFromRepoUrl(repoUrl)
  if (!identity) {
    return null
  }

  return {
    ...identity,
    repoUrl,
    source: 'slack-bot',
    sourceUrl,
    provenance: 'slack-bot',
    action: 'auto',
    requestText,
    projectName,
  }
}

export async function ingestOnboardingRequest(
  qx: QueryExecutor,
  { requestText, repoUrls, sourceUrl, projectName }: IOnboardingRequestIngest,
): Promise<IOnboardingRequestIngestResult> {
  const existing = await findExistingProjectCatalogRepoUrls(qx, repoUrls)
  const rows = repoUrls
    .filter((repoUrl) => !existing.has(repoUrl))
    .map((repoUrl) => toCatalogRow(repoUrl, { requestText, sourceUrl, projectName }))
    .filter((row): row is IDbProjectCatalogCreate => row !== null)

  const inserted = await bulkInsertProjectCatalog(qx, rows)
  const insertedUrls = new Set(inserted.map((row) => row.repoUrl))
  const alreadyCatalogued = repoUrls.filter((repoUrl) => !insertedUrls.has(repoUrl))

  await promoteProjectCatalogProvenance(
    qx,
    'slack-bot',
    alreadyCatalogued.map((repoUrl) => ({ repoUrl, sourceUrl })),
  )

  return {
    queued: inserted.map((row) => row.repoUrl),
    queuedIds: inserted.map((row) => row.id),
    alreadyCatalogued,
  }
}

export async function startOnboardingRequestEvaluation(
  temporal: OnboardingRequestTemporal,
  { channelId, messageTs, catalogIds }: IOnboardingRequestEvaluation,
): Promise<void> {
  try {
    await temporal.workflow.start('evaluateProjects', {
      taskQueue: 'projects-evaluation',
      workflowId: `evaluate-slack-${channelId}-${messageTs}`,
      workflowIdReusePolicy: WorkflowIdReusePolicy.REJECT_DUPLICATE,
      args: [{ catalogIds }],
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'WorkflowExecutionAlreadyStartedError') {
      return
    }
    throw err
  }
}

function requestedRepoUrls(requestText: string, parsed: IParsedOnboardingRequest | null): string[] {
  return parsed ? parsed.githubRepoUrls : extractGithubRepoUrls(requestText)
}

function reserveParserCall(
  actorId: string | undefined,
  log: RequestLog,
  context: { channelId: string; threadTs: string },
): boolean {
  if (!actorId) {
    log.warn(
      context,
      'Slack mention without a user id, falling back to the GitHub links in the text.',
    )
    return false
  }
  try {
    reserveDailyLlmCall(actorId)
    return true
  } catch (err) {
    log.warn(
      { ...context, actorId, error: getErrorMessage(err) },
      'Daily parser limit reached for this Slack user, falling back to the GitHub links in the text.',
    )
    return false
  }
}

async function earlierRequests(
  qx: QueryExecutor,
  repoUrls: string[],
  knownBefore: IDbProjectCatalog[],
): Promise<IDbProjectCatalog[]> {
  const known = new Map(knownBefore.map((row) => [row.repoUrl, row]))
  const insertedMeanwhile = await findProjectCatalogByRepoUrls(
    qx,
    repoUrls.filter((repoUrl) => !known.has(repoUrl)),
  )
  return [...knownBefore.filter((row) => repoUrls.includes(row.repoUrl)), ...insertedMeanwhile]
}

export async function parseRequestOrFallBack(
  qx: QueryExecutor,
  requestText: string,
  actorId: string | undefined,
  log: RequestLog,
  context: { channelId: string; threadTs: string },
): Promise<IParsedOnboardingRequest | null> {
  if (!reserveParserCall(actorId, log, context)) {
    return null
  }
  try {
    const parsed = await parseOnboardingRequest(requestText, createOnboardingRequestLlm(qx))
    if (parsed.ok === false) {
      log.warn(
        { ...context, reason: parsed.reason },
        'Onboarding request could not be parsed, falling back to the GitHub links in the text.',
      )
      return null
    }
    return parsed.request
  } catch (err) {
    log.warn(
      { ...context, error: getErrorMessage(err) },
      'Onboarding request parser failed, falling back to the GitHub links in the text.',
    )
  }
  return null
}

export async function runOnboardingRequestBot({
  text,
  channelId,
  messageTs,
  threadTs,
  actorId,
  options,
}: {
  text: string
  channelId: string
  messageTs: string
  threadTs: string
  actorId?: string
  options: Pick<IServiceOptions, 'log'> & { temporal: OnboardingRequestTemporal | null }
}): Promise<void> {
  const { log, temporal } = options
  const reply = async (message: string | ISlackMessageContent) => {
    const content = typeof message === 'string' ? { text: message } : message
    const result = await postSlackMessage({
      channel: channelId,
      thread_ts: threadTs,
      ...content,
    })
    if (!result.ok) {
      log.warn({ channelId, threadTs, error: result.error }, 'Slack bot reply was not delivered.')
    }
  }
  const react = async (status: BotStatus) => {
    const result = await addSlackReaction({
      channel: channelId,
      timestamp: messageTs,
      name: STATUS_REACTION[status],
    })
    if (!result.ok) {
      log.warn(
        { channelId, messageTs, status, error: result.error },
        'Slack reaction was not added.',
      )
    }
  }

  const fullText = toRequestText(text)
  if (!fullText || isHelpRequest(fullText)) {
    await reply(buildBotHelpReply())
    return
  }
  const truncated = fullText.length > MAX_REQUEST_TEXT_LENGTH
  const requestText = truncateRequestText(fullText)

  try {
    const qx = await getBgQx()
    const parsed = await parseRequestOrFallBack(qx, requestText, actorId, log, {
      channelId,
      threadTs,
    })
    if (parsed?.asksAboutHierarchy) {
      await reply(buildBotHierarchyQuestionReply(parsed))
      return
    }

    const repoUrls = requestedRepoUrls(requestText, parsed)
    if (repoUrls.length === 0) {
      await reply(buildBotNoRepositoryReply(parsed, { truncated, requestText }))
      return
    }

    const alreadyTracked = await findTrackedRepoProjects(qx, repoUrls)
    const trackedUrls = new Set(alreadyTracked.map((project) => project.repoUrl))
    const requested = repoUrls.filter((repoUrl) => !trackedUrls.has(repoUrl))
    const notes = collectIngestNotes({
      requestText,
      repoUrls,
      nonGithubRepoUrls: parsed ? parsed.nonGithubRepoUrls : null,
      truncated,
    })
    if (requested.length === 0) {
      log.info(
        { channelId, threadTs, tracked: alreadyTracked.length },
        'Every requested repository is already tracked.',
      )
      await reply(
        buildBotIngestReply({ queued: [], alreadyRequested: [], alreadyTracked, notes }, true),
      )
      await react('alreadyThere')
      return
    }

    const sourceUrl = await getSlackPermalink(channelId, messageTs)
    if (!sourceUrl) {
      throw new Error('Slack permalink for the request message is unavailable.')
    }
    const knownBefore = await findProjectCatalogByRepoUrls(qx, requested)
    const result = await ingestOnboardingRequest(qx, {
      requestText,
      repoUrls: requested,
      sourceUrl,
      projectName: parsed?.projectName ?? null,
    })

    log.info(
      {
        channelId,
        threadTs,
        queued: result.queued.length,
        alreadyCatalogued: result.alreadyCatalogued.length,
      },
      'Onboarding request queued from Slack.',
    )

    let evaluationStarted = true
    if (result.queuedIds.length > 0) {
      if (!temporal) {
        evaluationStarted = false
        log.warn(
          { channelId, threadTs, catalogIds: result.queuedIds },
          'Temporal is not configured, the Slack request waits for the scheduled evaluation.',
        )
      } else {
        try {
          await startOnboardingRequestEvaluation(temporal, {
            channelId,
            messageTs,
            catalogIds: result.queuedIds,
          })
        } catch (err) {
          evaluationStarted = false
          log.error(
            { error: getErrorMessage(err), channelId, threadTs, catalogIds: result.queuedIds },
            'Immediate evaluation could not be started for the Slack request.',
          )
        }
      }
    }

    const alreadyRequested = await earlierRequests(qx, result.alreadyCatalogued, knownBefore)
    await reply(
      buildBotIngestReply(
        { queued: result.queued, alreadyRequested, alreadyTracked, notes },
        evaluationStarted,
      ),
    )
    if (alreadyTracked.length > 0) {
      await react('alreadyThere')
    }
    for (const status of new Set(alreadyRequested.map(alreadyRequestedStatus))) {
      await react(status)
    }
    if (result.queuedIds.length > 0) {
      await react('checking')
    }
  } catch (err) {
    log.error({ error: getErrorMessage(err), channelId, threadTs }, 'Slack request failed.')
    await reply(buildBotFailureReply())
    await react('problem')
  }
}
