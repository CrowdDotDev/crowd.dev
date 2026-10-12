import { IDbProjectCatalog } from '@crowd/data-access-layer/src/project-catalog/types'
import {
  CdpSegmentLookupResult,
  IOnboardingInput,
  IOnboardingResult,
  ISegmentOnboardingInput,
} from '@crowd/project-onboarding'

export interface IProposedActionDeps {
  findCdpSegmentByPccProject: (pccProjectId: string) => Promise<CdpSegmentLookupResult>
  onboardProject: (input: IOnboardingInput) => Promise<IOnboardingResult>
  connectRepoToSegment: (input: ISegmentOnboardingInput) => Promise<IOnboardingResult>
}

type ProposedActionProject = Pick<
  IDbProjectCatalog,
  'id' | 'repoUrl' | 'repoName' | 'projectSlug' | 'proposedAction' | 'pccProjectId'
>

function errorResult(error: string): IOnboardingResult {
  return { outcome: 'error', segmentId: null, error }
}

async function resolveLfSegmentId(
  project: ProposedActionProject,
  deps: IProposedActionDeps,
): Promise<{ segmentId: string } | { error: string }> {
  if (!project.pccProjectId) {
    return { error: `Proposed action ${project.proposedAction} requires a PCC project id` }
  }

  const segment = await deps.findCdpSegmentByPccProject(project.pccProjectId)
  if (!segment) {
    return { error: `No CDP segment found for PCC project ${project.pccProjectId}` }
  }
  if ('duplicates' in segment) {
    return { error: `Several CDP segments share PCC project ${project.pccProjectId}` }
  }
  if (segment.integration === 'github-v1') {
    return {
      error: `Segment ${segment.segmentId} has a legacy GitHub integration, needs human review`,
    }
  }

  return { segmentId: segment.segmentId }
}

export async function runProposedAction(
  project: ProposedActionProject,
  deps: IProposedActionDeps,
): Promise<IOnboardingResult> {
  switch (project.proposedAction) {
    case null:
    case 'create_segment':
      return deps.onboardProject({
        id: project.id,
        repoUrl: project.repoUrl,
        repoName: project.repoName,
        projectSlug: project.projectSlug,
      })
    case 'create_integration':
    case 'update_integration': {
      const resolved = await resolveLfSegmentId(project, deps)
      if ('error' in resolved) {
        return errorResult(resolved.error)
      }
      return deps.connectRepoToSegment({ segmentId: resolved.segmentId, repoUrl: project.repoUrl })
    }
    case 'human_review':
      return errorResult('Proposed action human_review cannot be onboarded automatically')
  }
}
