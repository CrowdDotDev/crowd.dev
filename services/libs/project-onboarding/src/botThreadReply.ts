import { IDbProjectCatalog } from '@crowd/data-access-layer/src/project-catalog/types'
import { escapeSlackText } from '@crowd/slack'

import { deriveProjectSlug } from './onboarder'

export const INSIGHTS_PROJECT_URL_BASE = 'https://insights.linuxfoundation.org/project'
const MAX_REASON_LENGTH = 500

type BotReplyProject = Pick<IDbProjectCatalog, 'repoUrl'>
type BotOnboardedProject = Pick<IDbProjectCatalog, 'repoUrl' | 'projectSlug' | 'proposedAction'>

export function buildInsightsProjectUrl(projectSlug: string): string {
  return `${INSIGHTS_PROJECT_URL_BASE}/${deriveProjectSlug(projectSlug)}`
}

function repo(project: BotReplyProject): string {
  return `\`${escapeSlackText(project.repoUrl)}\``
}

function formatReason(reason: string): string {
  const truncated =
    reason.length > MAX_REASON_LENGTH ? `${reason.slice(0, MAX_REASON_LENGTH)}…` : reason
  return ['```', escapeSlackText(truncated), '```'].join('\n')
}

export function buildBotSkippedReply(project: BotReplyProject, reason: string): string {
  return [`:no_entry_sign: ${repo(project)} was not onboarded.`, formatReason(reason)].join('\n')
}

export function buildBotReviewReply(project: BotReplyProject): string {
  return `:eyes: ${repo(project)} needs a human review. The request was posted to the review channel, the outcome will be posted here.`
}

export function buildBotAutoApplyDisabledReply(project: BotReplyProject): string {
  return `:warning: Automatic onboarding is disabled, ${repo(project)} was not onboarded.`
}

export function buildBotOnboardedReply(project: BotOnboardedProject): string {
  if (
    project.proposedAction === 'create_integration' ||
    project.proposedAction === 'update_integration'
  ) {
    return `:white_check_mark: ${repo(project)} is now connected to its existing LFX Insights project. Data collection has started and the first metrics can take a few hours to show up.`
  }

  return `:white_check_mark: ${repo(project)} is now onboarded to LFX Insights. Data collection has started and the first metrics can take a few hours to show up: ${buildInsightsProjectUrl(project.projectSlug)}`
}

export function buildBotErroredReply(project: BotReplyProject, reason: string): string {
  return [`:x: Onboarding ${repo(project)} failed.`, formatReason(reason)].join('\n')
}
