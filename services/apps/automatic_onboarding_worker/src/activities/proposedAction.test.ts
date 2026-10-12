import { beforeEach, describe, expect, it, vi } from 'vitest'

import { IProposedActionDeps, runProposedAction } from './proposedAction'

const onboarded = { outcome: 'onboarded' as const, segmentId: 'seg', error: null }

const deps: IProposedActionDeps = {
  findCdpSegmentByPccProject: vi.fn(),
  onboardProject: vi.fn(async () => onboarded),
  connectRepoToSegment: vi.fn(async () => onboarded),
}

const project = {
  id: 'row-1',
  repoUrl: 'https://github.com/kubernetes/kops',
  repoName: 'kops',
  projectSlug: 'kubernetes-kops',
  proposedAction: null,
  pccProjectId: null,
}

describe('runProposedAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(deps.findCdpSegmentByPccProject).mockResolvedValue({
      segmentId: 'seg',
      name: 'Kubernetes',
      integration: 'none',
    })
  })

  it.each([null, 'create_segment' as const])(
    'creates a non-LF segment and integration for proposedAction %s',
    async (proposedAction) => {
      const result = await runProposedAction({ ...project, proposedAction }, deps)

      expect(result).toEqual(onboarded)
      expect(deps.onboardProject).toHaveBeenCalledWith({
        id: 'row-1',
        repoUrl: project.repoUrl,
        repoName: 'kops',
        projectSlug: 'kubernetes-kops',
      })
      expect(deps.connectRepoToSegment).not.toHaveBeenCalled()
    },
  )

  it.each(['create_integration' as const, 'update_integration' as const])(
    'connects the repo to the CDP segment of the PCC project for proposedAction %s',
    async (proposedAction) => {
      const result = await runProposedAction(
        { ...project, proposedAction, pccProjectId: 'pcc-1' },
        deps,
      )

      expect(result).toEqual(onboarded)
      expect(deps.findCdpSegmentByPccProject).toHaveBeenCalledWith('pcc-1')
      expect(deps.connectRepoToSegment).toHaveBeenCalledWith({
        segmentId: 'seg',
        repoUrl: project.repoUrl,
      })
      expect(deps.onboardProject).not.toHaveBeenCalled()
    },
  )

  it('fails when an LF action has no PCC project id', async () => {
    const result = await runProposedAction(
      { ...project, proposedAction: 'create_integration' },
      deps,
    )

    expect(result.outcome).toBe('error')
    expect(result.error).toContain('requires a PCC project id')
    expect(deps.connectRepoToSegment).not.toHaveBeenCalled()
  })

  it('fails when the PCC project has no CDP segment', async () => {
    vi.mocked(deps.findCdpSegmentByPccProject).mockResolvedValue(null)

    const result = await runProposedAction(
      { ...project, proposedAction: 'create_integration', pccProjectId: 'pcc-1' },
      deps,
    )

    expect(result.outcome).toBe('error')
    expect(result.error).toContain('No CDP segment found')
  })

  it('fails when several CDP segments share the PCC project', async () => {
    vi.mocked(deps.findCdpSegmentByPccProject).mockResolvedValue({
      duplicates: [
        { segmentId: 'a', name: 'A', integration: 'none' },
        { segmentId: 'b', name: 'B', integration: 'none' },
      ],
    })

    const result = await runProposedAction(
      { ...project, proposedAction: 'update_integration', pccProjectId: 'pcc-1' },
      deps,
    )

    expect(result.outcome).toBe('error')
    expect(result.error).toContain('Several CDP segments')
  })

  it('fails when the segment has a legacy GitHub integration', async () => {
    vi.mocked(deps.findCdpSegmentByPccProject).mockResolvedValue({
      segmentId: 'seg',
      name: 'Kubernetes',
      integration: 'github-v1',
    })

    const result = await runProposedAction(
      { ...project, proposedAction: 'update_integration', pccProjectId: 'pcc-1' },
      deps,
    )

    expect(result.outcome).toBe('error')
    expect(result.error).toContain('legacy GitHub integration')
    expect(deps.connectRepoToSegment).not.toHaveBeenCalled()
  })

  it('never onboards a human_review row', async () => {
    const result = await runProposedAction({ ...project, proposedAction: 'human_review' }, deps)

    expect(result.outcome).toBe('error')
    expect(deps.onboardProject).not.toHaveBeenCalled()
    expect(deps.connectRepoToSegment).not.toHaveBeenCalled()
  })
})
