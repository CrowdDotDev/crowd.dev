import { lockProjectCatalogOnboardingTarget } from '@crowd/data-access-layer'
import { IDbProjectCatalog } from '@crowd/data-access-layer/src/project-catalog/types'
import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import {
  CdpSegmentLookupResult,
  IOnboardingInput,
  IOnboardingResult,
  ISegmentReposOnboardingInput,
  joinsExistingProject,
} from '@crowd/project-onboarding'

export interface IProposedActionDeps {
  findCdpSegmentByPccProject: (pccProjectId: string) => Promise<CdpSegmentLookupResult>
  onboardProject: (input: IOnboardingInput) => Promise<IOnboardingResult>
  connectReposToSegment: (input: ISegmentReposOnboardingInput) => Promise<IOnboardingResult>
}

type ProposedActionProject = Pick<
  IDbProjectCatalog,
  | 'id'
  | 'repoUrl'
  | 'repoName'
  | 'projectSlug'
  | 'proposedAction'
  | 'pccProjectId'
  | 'matchedSegmentId'
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

  const lookup = await deps.findCdpSegmentByPccProject(project.pccProjectId)
  if (!lookup) {
    return { error: `No CDP segment found for PCC project ${project.pccProjectId}` }
  }
  // A requester may have picked one of several segments at classification; only that choice,
  // still among the candidates, lets a duplicate result through.
  const segment =
    'duplicates' in lookup
      ? lookup.duplicates.find((candidate) => candidate.segmentId === project.matchedSegmentId)
      : lookup
  if (!segment) {
    return { error: `Several CDP segments share PCC project ${project.pccProjectId}` }
  }
  if (segment.integration === 'github-v1') {
    return {
      error: `Segment ${segment.segmentId} has a legacy GitHub integration, needs human review`,
    }
  }

  return { segmentId: segment.segmentId }
}

// The rows share the proposal, the PCC project and the segment, so the lead's resolution
// stands for all of them.
async function connectToExistingProject(
  projects: ProposedActionProject[],
  deps: IProposedActionDeps,
): Promise<IOnboardingResult> {
  const resolved = await resolveLfSegmentId(projects[0], deps)
  if ('error' in resolved) {
    return errorResult(resolved.error)
  }
  return deps.connectReposToSegment({
    segmentId: resolved.segmentId,
    repoUrls: projects.map((project) => project.repoUrl),
  })
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
    case 'update_integration':
      return connectToExistingProject([project], deps)
    case 'human_review':
      return errorResult('Proposed action human_review cannot be onboarded automatically')
  }
}

export async function runOrganizationProposedAction(
  projects: ProposedActionProject[],
  deps: IProposedActionDeps,
): Promise<IOnboardingResult> {
  const [lead] = projects
  if (!lead || !joinsExistingProject(lead)) {
    return errorResult('Only repositories joining an existing project can be onboarded together')
  }
  return connectToExistingProject(projects, deps)
}

function writesSharedSegment(
  project: ProposedActionProject | undefined,
): project is ProposedActionProject & { pccProjectId: string } {
  return !!project && project.pccProjectId !== null && joinsExistingProject(project)
}

async function withSegmentLock(
  lead: ProposedActionProject | undefined,
  qx: QueryExecutor,
  buildDeps: (qx: QueryExecutor) => IProposedActionDeps,
  run: (deps: IProposedActionDeps) => Promise<IOnboardingResult>,
): Promise<IOnboardingResult> {
  if (!writesSharedSegment(lead)) {
    return run(buildDeps(qx))
  }
  return qx.tx(async (tx) => {
    await lockProjectCatalogOnboardingTarget(tx, lead.pccProjectId)
    return run(buildDeps(tx))
  })
}

export async function runProposedActionSerialized(
  project: ProposedActionProject,
  qx: QueryExecutor,
  buildDeps: (qx: QueryExecutor) => IProposedActionDeps,
): Promise<IOnboardingResult> {
  return withSegmentLock(project, qx, buildDeps, (deps) => runProposedAction(project, deps))
}

export async function runOrganizationProposedActionSerialized(
  projects: ProposedActionProject[],
  qx: QueryExecutor,
  buildDeps: (qx: QueryExecutor) => IProposedActionDeps,
): Promise<IOnboardingResult> {
  return withSegmentLock(projects[0], qx, buildDeps, (deps) =>
    runOrganizationProposedAction(projects, deps),
  )
}
