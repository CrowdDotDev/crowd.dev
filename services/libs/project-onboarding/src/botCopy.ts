import { canonicalizeRepoUrl } from '@crowd/common'
import {
  IDbProjectCatalog,
  ProjectCatalogProposedAction,
} from '@crowd/data-access-layer/src/project-catalog/types'
import { escapeSlackText } from '@crowd/slack'

export const INSIGHTS_PROJECT_URL_BASE = 'https://insights.linuxfoundation.org/project'

export const STATUS = {
  checking: '⏳',
  added: '✅',
  alreadyThere: '📘',
  withTeam: '👀',
  notAdded: '🚫',
  problem: '⚠️',
} as const

export const NEXT_STEP_RESEND =
  'Reply here mentioning me with the project name and the GitHub links, or ask the CDP team in this channel.'
export const NEXT_STEP_WAIT = "You'll get the result in this thread."
export const NEXT_STEP_DISPUTE = 'Reply here if this looks wrong.'

const PROPOSED_ACTION_LABELS: Record<ProjectCatalogProposedAction, string> = {
  create_segment: 'Create the project in LFX Insights, then add this repo',
  create_integration: 'Connect GitHub to the project with this repo',
  update_integration: "Add this repo to the project's GitHub connection",
  human_review: 'Needs a person: see why above',
}

type TechnicalRow = Pick<IDbProjectCatalog, 'classificationKind' | 'proposedAction'>

export function repoLabel(repoUrl: string): string {
  const canonical = canonicalizeRepoUrl(repoUrl)
  if (!canonical?.isGithub) {
    return `*${escapeSlackText(repoUrl)}*`
  }
  return `*<${canonical.url}|${escapeSlackText(`${canonical.owner}/${canonical.repo}`)}>*`
}

export function describeProposedAction(action: ProjectCatalogProposedAction | null): string {
  return action ? PROPOSED_ACTION_LABELS[action] : 'Nothing decided yet'
}

export function technicalDetails({
  classificationKind,
  proposedAction,
}: TechnicalRow): string | null {
  const parts = [classificationKind, proposedAction].filter(
    (part): part is NonNullable<typeof part> => part !== null,
  )
  return parts.length > 0 ? `Details: ${parts.join(' · ')}` : null
}
