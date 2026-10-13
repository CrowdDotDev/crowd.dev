import { canonicalizeRepoUrl } from '@crowd/common'
import {
  IDbProjectCatalogClassification,
  ProjectCatalogClassificationKind,
  ProjectCatalogProposedAction,
} from '@crowd/data-access-layer/src/project-catalog/types'

import { IClassificationTrace, createClassificationTrace } from './classificationTrace'
import {
  IRequestClassificationDeps,
  ParsedRequestSource,
  resolveParsedRequest,
} from './classifyRequest'
import { IParsedOnboardingRequest, parseOnboardingRequest } from './requestParser'
import { OnboardingResolution } from './requestResolver'
import { IRoutingOptions, routeResolution } from './routing'

export interface ICatalogRowToClassify {
  repoUrl: string
  projectName: string | null
  requestText: string | null
}

export interface ICatalogRowClassification {
  resolution: OnboardingResolution
  trace: IClassificationTrace
  classification: IDbProjectCatalogClassification
}

export type CatalogRowClassificationDeps = IRequestClassificationDeps & IRoutingOptions

type RowRepositories = Pick<IParsedOnboardingRequest, 'githubRepoUrls' | 'nonGithubRepoUrls'>

function rowRepositories(row: ICatalogRowToClassify): RowRepositories {
  const canonical = canonicalizeRepoUrl(row.repoUrl)
  const isGithub = canonical?.isGithub === true

  return {
    githubRepoUrls: isGithub ? [canonical.url] : [],
    nonGithubRepoUrls: isGithub ? [] : [canonical?.url ?? row.repoUrl],
  }
}

function requestFromRepoUrl(row: ICatalogRowToClassify): IParsedOnboardingRequest {
  return {
    ...rowRepositories(row),
    linksToFollow: [],
    projectName: row.projectName,
    declaredLf: null,
    asksAboutHierarchy: false,
  }
}

function parsedRequestSource(
  row: ICatalogRowToClassify,
  deps: IRequestClassificationDeps,
): ParsedRequestSource {
  const { requestText } = row
  if (!requestText) {
    return async () => ({ ok: true, request: requestFromRepoUrl(row) })
  }

  return async () => {
    const parsed = await parseOnboardingRequest(requestText, deps.queryLlm)
    if (parsed.ok === false) {
      if (parsed.retryable) {
        throw new Error(parsed.reason)
      }
      return parsed
    }

    return {
      ok: true,
      request: {
        ...parsed.request,
        ...rowRepositories(row),
        projectName: parsed.request.projectName ?? row.projectName,
      },
    }
  }
}

interface IProposal {
  classificationKind: ProjectCatalogClassificationKind
  proposedAction: ProjectCatalogProposedAction | null
  pccProjectId: string | null
}

function toProposal(resolution: OnboardingResolution): IProposal {
  switch (resolution.kind) {
    case 'non_lf_new_project':
      return {
        classificationKind: resolution.kind,
        proposedAction: 'create_segment',
        pccProjectId: null,
      }
    case 'lf_not_in_cdp':
      return {
        classificationKind: resolution.kind,
        proposedAction: 'human_review',
        pccProjectId: resolution.pccProject.projectId,
      }
    case 'lf_in_cdp':
      return {
        classificationKind: resolution.kind,
        proposedAction: resolution.action,
        pccProjectId: resolution.pccProject.projectId,
      }
    case 'lf_owner_in_cdp':
      return { classificationKind: 'lf_in_cdp', proposedAction: 'human_review', pccProjectId: null }
    case 'already_tracked':
    case 'ambiguous':
    case 'non_github_source':
    case 'lf_not_in_pcc':
      return { classificationKind: resolution.kind, proposedAction: null, pccProjectId: null }
  }
}

export type CatalogRowOutcome = Omit<IDbProjectCatalogClassification, 'projectName'>

export function toCatalogClassification(
  resolution: OnboardingResolution,
  options: IRoutingOptions,
): CatalogRowOutcome {
  return { ...toProposal(resolution), ...routeResolution(resolution, options) }
}

function resolvedProjectName(
  row: ICatalogRowToClassify,
  trace: IClassificationTrace,
): string | null {
  return trace.parsed?.projectName ?? row.projectName
}

export async function classifyCatalogRow(
  row: ICatalogRowToClassify,
  deps: CatalogRowClassificationDeps,
): Promise<ICatalogRowClassification> {
  const trace = createClassificationTrace()
  const resolution = await resolveParsedRequest(parsedRequestSource(row, deps), deps.lookups, trace)

  return {
    resolution,
    trace,
    classification: {
      projectName: resolvedProjectName(row, trace),
      ...toCatalogClassification(resolution, { autoApply: deps.autoApply }),
    },
  }
}
