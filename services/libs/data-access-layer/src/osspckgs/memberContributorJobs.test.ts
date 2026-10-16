import { describe, expect, it, vi } from 'vitest'

import { QueryExecutor } from '../queryExecutor'
import {
  completeMemberContributorJob,
  createMemberContributorJob,
  failMemberContributorJob,
  findActiveMemberContributorJobByPurl,
  findLatestMemberContributorJobByPurl,
  findLatestMemberContributorJobStatusByPurl,
  findMemberContributorJob,
  findMemberContributorJobPurl,
  findMemberContributorJobRepo,
  incrementMemberContributorJobSubmissions,
  markMemberContributorJobRunning,
  markMemberContributorJobUnresolvable,
  recordMemberContributorJobInferredRepo,
  recordMemberContributorJobLlmUsage,
} from './memberContributorJobs'

interface RecordedCall {
  method: string
  query: string
  params?: object
}

function fakeQx(selectOneOrNoneRow: object | null = null) {
  const calls: RecordedCall[] = []
  const record = (method: string, query: string, params?: object) =>
    calls.push({ method, query, params })
  const executor = {
    selectOneOrNone: vi.fn(async (query: string, params?: object) => {
      record('selectOneOrNone', query, params)
      return selectOneOrNoneRow
    }),
    result: vi.fn(async (query: string, params?: object) => {
      record('result', query, params)
      return 1
    }),
    select: vi.fn(),
    selectOne: vi.fn(),
    selectNone: vi.fn(),
    tx: vi.fn(),
  }
  return { qx: executor as unknown as QueryExecutor, calls }
}

const input = {
  id: '11111111-1111-4111-8111-111111111111',
  purl: 'pkg:npm/request-oauth',
  ecosystem: 'npm',
  collectionPath: 'github' as const,
  packageId: '2008420',
  repoId: '590455',
}

describe('createMemberContributorJob', () => {
  it('inserts a pending row and returns its id', async () => {
    const { qx, calls } = fakeQx({ id: input.id })
    await expect(createMemberContributorJob(qx, input)).resolves.toBe(input.id)
    expect(calls[0].query).toContain('INSERT INTO member_contributor_jobs')
    expect(calls[0].query).toContain("'pending'")
    expect(calls[0].query).toContain(
      "ON CONFLICT (purl) WHERE status IN ('pending', 'running') DO NOTHING",
    )
    expect(calls[0].query).toContain('RETURNING id')
    expect(calls[0].params).toEqual(input)
  })

  it('returns null when an active job for the purl already exists', async () => {
    const { qx } = fakeQx(null)
    await expect(createMemberContributorJob(qx, input)).resolves.toBeNull()
  })
})

describe('findActiveMemberContributorJobByPurl', () => {
  it('looks up pending or running jobs by purl', async () => {
    const { qx, calls } = fakeQx({ id: input.id })
    await expect(findActiveMemberContributorJobByPurl(qx, input.purl)).resolves.toEqual({
      id: input.id,
    })
    expect(calls[0].query).toContain("status IN ('pending', 'running')")
    expect(calls[0].params).toEqual({ purl: input.purl })
  })
})

describe('findLatestMemberContributorJobStatusByPurl', () => {
  it('returns the status of the most recent job for the purl', async () => {
    const { qx, calls } = fakeQx({ status: 'failed' })
    await expect(findLatestMemberContributorJobStatusByPurl(qx, input.purl)).resolves.toBe('failed')
    expect(calls[0].query).toContain('WHERE purl = $(purl)')
    expect(calls[0].query).toContain('ORDER BY created_at DESC, id DESC')
    expect(calls[0].query).toContain('LIMIT 1')
    expect(calls[0].params).toEqual({ purl: input.purl })
  })

  it('returns null when the purl has no jobs', async () => {
    const { qx } = fakeQx(null)
    await expect(findLatestMemberContributorJobStatusByPurl(qx, input.purl)).resolves.toBeNull()
  })
})

describe('findMemberContributorJob', () => {
  it('selects the job row with camelCased ids as text', async () => {
    const { qx, calls } = fakeQx(null)
    await expect(findMemberContributorJob(qx, input.id)).resolves.toBeNull()
    expect(calls[0].query).toContain('package_id::text AS "packageId"')
    expect(calls[0].query).toContain('repo_id::text AS "repoId"')
    expect(calls[0].params).toEqual({ id: input.id })
  })
})

describe('findMemberContributorJobRepo', () => {
  it('joins the linked repo and returns its url and host', async () => {
    const { qx, calls } = fakeQx({
      repoId: '590455',
      repoUrl: 'https://github.com/a/b',
      repoHost: 'github',
    })
    await expect(findMemberContributorJobRepo(qx, input.id)).resolves.toEqual({
      repoId: '590455',
      repoUrl: 'https://github.com/a/b',
      repoHost: 'github',
    })
    expect(calls[0].query).toContain('JOIN repos r ON r.id = j.repo_id')
  })
})

describe('status transitions', () => {
  it('marks running only from pending', async () => {
    const { qx, calls } = fakeQx()
    await markMemberContributorJobRunning(qx, input.id)
    expect(calls[0].query).toContain("status = 'running'")
    expect(calls[0].query).toContain('started_at = NOW()')
    expect(calls[0].query).toContain("WHERE id = $(id) AND status = 'pending'")
  })

  it('marks done only from running', async () => {
    const { qx, calls } = fakeQx()
    await completeMemberContributorJob(qx, input.id)
    expect(calls[0].query).toContain("status = 'done'")
    expect(calls[0].query).toContain('completed_at = NOW()')
    expect(calls[0].query).toContain("WHERE id = $(id) AND status = 'running'")
  })

  it('marks failed with the reason unless already done', async () => {
    const { qx, calls } = fakeQx()
    await failMemberContributorJob(qx, input.id, 'boom')
    expect(calls[0].query).toContain("status = 'failed'")
    expect(calls[0].query).toContain('error = $(error)')
    expect(calls[0].query).toContain("WHERE id = $(id) AND status <> 'done'")
    expect(calls[0].params).toEqual({ id: input.id, error: 'boom' })
  })
})

describe('findMemberContributorJobPurl', () => {
  it('reads purl and ecosystem by id', async () => {
    const { qx, calls } = fakeQx({ purl: 'pkg:hackage/aeson', ecosystem: 'hackage' })
    await expect(findMemberContributorJobPurl(qx, 'job-1')).resolves.toEqual({
      purl: 'pkg:hackage/aeson',
      ecosystem: 'hackage',
    })
    expect(calls[0].query).toContain('SELECT purl, ecosystem')
    expect(calls[0].params).toEqual({ id: 'job-1' })
  })
})

describe('findLatestMemberContributorJobByPurl', () => {
  it('returns id, status and collection path of the newest job', async () => {
    const { qx, calls } = fakeQx({ id: 'job-1', status: 'done', collectionPath: 'llm_repo_resolution' })
    await expect(findLatestMemberContributorJobByPurl(qx, 'pkg:hackage/aeson')).resolves.toEqual({
      id: 'job-1',
      status: 'done',
      collectionPath: 'llm_repo_resolution',
    })
    expect(calls[0].query).toContain('ORDER BY created_at DESC, id DESC')
    expect(calls[0].query).toContain('LIMIT 1')
  })
})

describe('recordMemberContributorJobInferredRepo', () => {
  it('writes repo url, source, confidence and usage on a running job', async () => {
    const { qx, calls } = fakeQx()
    await recordMemberContributorJobInferredRepo(qx, 'job-1', {
      repoUrl: 'https://github.com/haskell/aeson',
      confidence: 0.92,
      inputTokens: 300,
      outputTokens: 80,
      costUsd: 0.0014,
    })
    expect(calls[0].method).toBe('result')
    expect(calls[0].query).toContain("repo_url_source = 'llm_inferred'")
    expect(calls[0].query).toContain("WHERE id = $(id) AND status = 'running'")
    expect(calls[0].params).toEqual({
      id: 'job-1',
      repoUrl: 'https://github.com/haskell/aeson',
      confidence: 0.92,
      inputTokens: 300,
      outputTokens: 80,
      costUsd: 0.0014,
    })
  })
})

describe('recordMemberContributorJobLlmUsage', () => {
  it('writes only the usage columns on a running job', async () => {
    const { qx, calls } = fakeQx()
    await recordMemberContributorJobLlmUsage(qx, 'job-1', {
      inputTokens: 300,
      outputTokens: 20,
      costUsd: null,
    })
    expect(calls[0].query).not.toContain('repo_url')
    expect(calls[0].query).toContain("status = 'running'")
    expect(calls[0].params).toEqual({
      id: 'job-1',
      inputTokens: 300,
      outputTokens: 20,
      costUsd: null,
    })
  })
})

describe('markMemberContributorJobUnresolvable', () => {
  it('sets unresolvable with reason and repo url unless the job is done', async () => {
    const { qx, calls } = fakeQx()
    await markMemberContributorJobUnresolvable(qx, 'job-1', 'LLM returned no repository', null)
    expect(calls[0].query).toContain("status = 'unresolvable'")
    expect(calls[0].query).toContain('repo_url = COALESCE($(repoUrl), repo_url)')
    expect(calls[0].query).toContain("WHERE id = $(id) AND status <> 'done'")
    expect(calls[0].params).toEqual({
      id: 'job-1',
      reason: 'LLM returned no repository',
      repoUrl: null,
    })
  })
})

describe('incrementMemberContributorJobSubmissions', () => {
  it('increments submission_count', async () => {
    const { qx, calls } = fakeQx()
    await incrementMemberContributorJobSubmissions(qx, 'job-1')
    expect(calls[0].query).toContain('submission_count = submission_count + 1')
    expect(calls[0].params).toEqual({ id: 'job-1' })
  })
})

describe('findMemberContributorJob columns', () => {
  it('selects the collection path and inferred repo columns', async () => {
    const { qx, calls } = fakeQx(null)
    await findMemberContributorJob(qx, 'job-1')
    expect(calls[0].query).toContain('collection_path AS "collectionPath"')
    expect(calls[0].query).toContain('repo_url AS "repoUrl"')
    expect(calls[0].query).toContain('repo_url_source AS "repoUrlSource"')
  })
})
