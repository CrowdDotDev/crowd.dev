import { IDbProjectCatalog } from '@crowd/data-access-layer/src/project-catalog/types'
import { escapeSlackText } from '@crowd/slack'

import { NEXT_STEP_DISPUTE, NEXT_STEP_RESEND, NEXT_STEP_WAIT, STATUS, repoLabel } from './botCopy'
import { deriveProjectSlug } from './onboarder'

export const INSIGHTS_PROJECT_URL_BASE = 'https://insights.linuxfoundation.org/project'
const MAX_REASON_LENGTH = 500
const DATA_SYNC_NOTE = 'Activity shows up after the first data sync.'

type BotReplyProject = Pick<IDbProjectCatalog, 'repoUrl'>
type BotSkippedProject = Pick<IDbProjectCatalog, 'repoUrl' | 'classificationKind'>
type BotReviewProject = Pick<IDbProjectCatalog, 'repoUrl' | 'reviewReason'>
type BotOnboardedProject = Pick<
  IDbProjectCatalog,
  'repoUrl' | 'projectSlug' | 'proposedAction' | 'projectName'
>
type BotRejectedProject = Pick<IDbProjectCatalog, 'repoUrl' | 'reviewedBy'>

export function buildInsightsProjectUrl(projectSlug: string): string {
  return `${INSIGHTS_PROJECT_URL_BASE}/${deriveProjectSlug(projectSlug)}`
}

function repo(project: BotReplyProject): string {
  return repoLabel(project.repoUrl)
}

function stripTrailingPeriods(text: string): string {
  let end = text.length
  while (end > 0 && (text[end - 1] === '.' || text[end - 1] === ' ')) {
    end -= 1
  }
  return text.slice(0, end)
}

function formatReason(reason: string): string {
  const trimmed = stripTrailingPeriods(reason.trim())
  const truncated =
    trimmed.length > MAX_REASON_LENGTH ? `${trimmed.slice(0, MAX_REASON_LENGTH)}…` : trimmed
  return escapeSlackText(truncated)
}

function reply(...lines: string[]): string {
  return lines.join('\n')
}

export function buildBotSkippedReply(project: BotSkippedProject, reason: string): string {
  if (project.classificationKind === 'already_tracked') {
    return `${STATUS.alreadyThere} ${repo(project)} is already in LFX Insights. Nothing else to do.`
  }
  return reply(
    `${STATUS.notAdded} ${repo(project)} wasn't added: ${formatReason(reason)}.`,
    NEXT_STEP_RESEND,
  )
}

export function buildBotReviewReply(project: BotReviewProject): string {
  const summary = project.reviewReason
    ? `${STATUS.withTeam} ${repo(project)}: ${formatReason(project.reviewReason)}. I've sent the CDP team your request.`
    : `${STATUS.withTeam} ${repo(project)} needs a quick check by the CDP team before I add it. I've sent them your request.`
  return reply(summary, NEXT_STEP_WAIT)
}

export function buildBotAutoApplyDisabledReply(project: BotReplyProject): string {
  return reply(
    `${STATUS.notAdded} ${repo(project)} isn't part of a project in LFX Insights yet, so I can't add it automatically. New projects are added by the CDP team.`,
    'To request it, ask the CDP team in this channel with the project name and the repo link.',
  )
}

export function buildBotOnboardedReply(project: BotOnboardedProject): string {
  if (
    project.proposedAction === 'create_integration' ||
    project.proposedAction === 'update_integration'
  ) {
    const destination = project.projectName
      ? `under *${escapeSlackText(project.projectName)}*`
      : 'in its existing project'
    return `${STATUS.added} ${repo(project)} is now in LFX Insights ${destination}. ${DATA_SYNC_NOTE}`
  }

  return `${STATUS.added} ${repo(project)} is now in LFX Insights: <${buildInsightsProjectUrl(project.projectSlug)}|View project>. ${DATA_SYNC_NOTE}`
}

export function buildBotErroredReply(project: BotReplyProject): string {
  return reply(
    `${STATUS.problem} Something went wrong on our side while adding ${repo(project)}. Your request is saved and the CDP team can see the error.`,
    "Ask the CDP team in this channel if you don't hear back.",
  )
}

export function buildBotRejectedReply(project: BotRejectedProject): string {
  const reviewer = project.reviewedBy ? `<@${project.reviewedBy}>` : 'The CDP team'
  return reply(
    `${STATUS.notAdded} ${repo(project)} wasn't added. ${reviewer} reviewed it and rejected the request.`,
    NEXT_STEP_DISPUTE,
  )
}
