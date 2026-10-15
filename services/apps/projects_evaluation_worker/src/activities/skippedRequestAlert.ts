import {
  IDbProjectCatalog,
  isSlackBotProvenance,
  isSlackPermalink,
} from '@crowd/data-access-layer/src/project-catalog/types'
import { SlackMessageSection } from '@crowd/slack'

const MAX_REASON_LENGTH = 500

function truncateReason(reason: string): string {
  return reason.length > MAX_REASON_LENGTH ? `${reason.slice(0, MAX_REASON_LENGTH)}…` : reason
}

function formatRequestedIn(
  project: Pick<IDbProjectCatalog, 'sourceUrl'> & Partial<Pick<IDbProjectCatalog, 'provenance'>>,
): string {
  const fromSlack = isSlackBotProvenance(project.provenance ?? null)

  if (fromSlack) {
    return project.sourceUrl && isSlackPermalink(project.sourceUrl)
      ? `<${project.sourceUrl}|Slack request>`
      : '_source Slack message not recorded_'
  }

  return project.sourceUrl
    ? `<${project.sourceUrl}|${project.sourceUrl}>`
    : '_source discussion not recorded_'
}

type AlertProject = Pick<IDbProjectCatalog, 'repoName' | 'repoUrl' | 'sourceUrl'> &
  Partial<Pick<IDbProjectCatalog, 'provenance'>>

export function buildRequestAlert(
  project: AlertProject,
  reasonTitle: string,
  reason: string,
): SlackMessageSection[] {
  const requestedIn = formatRequestedIn(project)

  return [
    {
      title: '',
      text: [`*${project.repoName}*`, project.repoUrl, `Requested in: ${requestedIn}`].join('\n'),
    },
    {
      title: reasonTitle,
      text: ['```', truncateReason(reason), '```'].join('\n'),
    },
  ]
}

export function buildSkippedDiscussionAlert(
  project: AlertProject,
  reason: string,
): SlackMessageSection[] {
  return buildRequestAlert(project, 'Skip reason', reason)
}
