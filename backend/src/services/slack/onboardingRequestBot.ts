import { extractGithubRepoUrls, getErrorMessage, truncateRequestText } from '@crowd/common'
import {
  bulkInsertProjectCatalog,
  deriveProjectIdentityFromRepoUrl,
  findExistingProjectCatalogRepoUrls,
  promoteProjectCatalogProvenance,
} from '@crowd/data-access-layer'
import { IDbProjectCatalogCreate } from '@crowd/data-access-layer/src/project-catalog/types'
import type { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import { getSlackPermalink, postSlackMessage } from '@crowd/slack'

import { IServiceOptions } from '../IServiceOptions'
import { getBgQx } from './slackBackground'

const MENTION_PATTERN = /<@[A-Z0-9]+>/g
const LINK_WITH_LABEL_PATTERN = /<(https?:\/\/[^|>\s]+)\|[^>]*>/g
const LINK_PATTERN = /<(https?:\/\/[^>\s]+)>/g

const HELP_TEXT =
  'Tell me about the project you want to onboard: its name, whether it is a Linux Foundation project and the GitHub repositories.'

const NO_REPOSITORY_TEXT =
  ':mag: I could not find a GitHub repository in this request. Mention me again with the full GitHub repository URL(s) of the project.'

const FAILURE_TEXT = ':no_entry: I could not record this request, please try again later.'

export interface IOnboardingRequestIngest {
  requestText: string
  repoUrls: string[]
  sourceUrl: string
}

export interface IOnboardingRequestIngestResult {
  queued: string[]
  alreadyCatalogued: string[]
}

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

function toCatalogRow(
  repoUrl: string,
  { requestText, sourceUrl }: Pick<IOnboardingRequestIngest, 'requestText' | 'sourceUrl'>,
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
    projectName: null,
  }
}

export async function ingestOnboardingRequest(
  qx: QueryExecutor,
  { requestText, repoUrls, sourceUrl }: IOnboardingRequestIngest,
): Promise<IOnboardingRequestIngestResult> {
  const existing = await findExistingProjectCatalogRepoUrls(qx, repoUrls)
  const alreadyCatalogued = repoUrls.filter((repoUrl) => existing.has(repoUrl))
  const rows = repoUrls
    .filter((repoUrl) => !existing.has(repoUrl))
    .map((repoUrl) => toCatalogRow(repoUrl, { requestText, sourceUrl }))
    .filter((row): row is IDbProjectCatalogCreate => row !== null)

  await promoteProjectCatalogProvenance(
    qx,
    'slack-bot',
    alreadyCatalogued.map((repoUrl) => ({ repoUrl, sourceUrl })),
  )
  await bulkInsertProjectCatalog(qx, rows)

  return { queued: rows.map((row) => row.repoUrl), alreadyCatalogued }
}

function bulletList(urls: string[]): string {
  return urls.map((url) => `• ${url}`).join('\n')
}

export function buildQueuedReply({
  queued,
  alreadyCatalogued,
}: IOnboardingRequestIngestResult): string {
  const parts: string[] = []

  if (queued.length > 0) {
    parts.push(`:inbox_tray: Queued for onboarding evaluation:\n${bulletList(queued)}`)
  }
  if (alreadyCatalogued.length > 0) {
    parts.push(
      `Already in the project catalog, not queued again:\n${bulletList(alreadyCatalogued)}`,
    )
  }
  if (queued.length > 0) {
    parts.push('The outcome will be posted in this thread.')
  }

  return parts.join('\n\n')
}

export async function runOnboardingRequestBot({
  text,
  channelId,
  messageTs,
  threadTs,
  options,
}: {
  text: string
  channelId: string
  messageTs: string
  threadTs: string
  options: Pick<IServiceOptions, 'log'>
}): Promise<void> {
  const { log } = options
  const reply = async (message: string) => {
    const result = await postSlackMessage({
      channel: channelId,
      thread_ts: threadTs,
      text: message,
    })
    if (!result.ok) {
      log.warn({ channelId, threadTs, error: result.error }, 'Slack bot reply was not delivered.')
    }
  }

  const requestText = toRequestText(text)
  if (!requestText) {
    await reply(HELP_TEXT)
    return
  }

  const repoUrls = extractGithubRepoUrls(requestText)
  if (repoUrls.length === 0) {
    await reply(NO_REPOSITORY_TEXT)
    return
  }

  try {
    const sourceUrl = await getSlackPermalink(channelId, messageTs)
    if (!sourceUrl) {
      throw new Error('Slack permalink for the request message is unavailable.')
    }
    const qx = await getBgQx()
    const result = await ingestOnboardingRequest(qx, {
      requestText: truncateRequestText(requestText),
      repoUrls,
      sourceUrl,
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
    await reply(buildQueuedReply(result))
  } catch (err) {
    log.error({ error: getErrorMessage(err), channelId, threadTs }, 'Slack request failed.')
    await reply(FAILURE_TEXT)
  }
}
