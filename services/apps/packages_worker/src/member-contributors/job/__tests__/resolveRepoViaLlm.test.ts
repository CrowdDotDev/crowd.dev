import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as jobsDal from '@crowd/data-access-layer/src/osspckgs/memberContributorJobs'

import { getBedrockCredentials, getGithubAppConfig } from '../../../config'
import { githubApiGet } from '../../../security-contacts/githubToken'
import { inferRepositoryCandidates } from '../llmRepoInference'
import { resolveRepoViaLlm } from '../resolveRepoViaLlm'

const qx = vi.hoisted(() => ({}))

vi.mock('../../../db', () => ({ getPackagesDb: vi.fn().mockResolvedValue(qx) }))
vi.mock('../../../config', () => ({
  getBedrockCredentials: vi.fn(),
  getGithubAppConfig: vi.fn(),
}))
vi.mock('../../../llm/bedrockClient', () => ({ invokeBedrockModel: vi.fn(() => vi.fn()) }))
vi.mock('../../../security-contacts/githubToken', () => ({ githubApiGet: vi.fn() }))
vi.mock('../llmRepoInference', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../llmRepoInference')>()),
  inferRepositoryCandidates: vi.fn(),
}))
vi.mock('@crowd/data-access-layer/src/osspckgs/memberContributorJobs', () => ({
  recordMemberContributorJobInferredRepo: vi.fn(),
  recordMemberContributorJobLlmUsage: vi.fn(),
}))

const usage = { inputTokens: 300, outputTokens: 80, costUsd: 0.0014 }
const input = { jobId: 'job-1', purl: 'pkg:hackage/aeson' }
const recordRepo = vi.mocked(jobsDal.recordMemberContributorJobInferredRepo)
const recordUsage = vi.mocked(jobsDal.recordMemberContributorJobLlmUsage)

function expectUsageRecordedOnceBeforeGithub() {
  expect(recordUsage).toHaveBeenCalledTimes(1)
  expect(recordUsage).toHaveBeenCalledWith(qx, 'job-1', usage)
  const githubCalls = vi.mocked(githubApiGet).mock.invocationCallOrder
  if (githubCalls.length > 0) {
    expect(recordUsage.mock.invocationCallOrder[0]).toBeLessThan(githubCalls[0])
  }
}

function answered(candidates: Array<{ repositoryUrl: string; confidence: number }>) {
  vi.mocked(inferRepositoryCandidates).mockResolvedValue({ status: 'answered', candidates, usage })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getBedrockCredentials).mockReturnValue({ accessKeyId: 'k', secretAccessKey: 's' })
  vi.mocked(getGithubAppConfig).mockReturnValue(
    {} as unknown as ReturnType<typeof getGithubAppConfig>,
  )
  vi.mocked(githubApiGet).mockResolvedValue({ status: 200, text: '{}' })
})

describe('resolveRepoViaLlm', () => {
  it('resolves the first candidate that exists on GitHub and records it on the job', async () => {
    answered([{ repositoryUrl: 'https://github.com/Haskell/aeson.git', confidence: 0.95 }])

    await expect(resolveRepoViaLlm(input)).resolves.toEqual({
      outcome: 'resolved',
      repoUrl: 'https://github.com/haskell/aeson',
      confidence: 0.95,
    })
    expect(githubApiGet).toHaveBeenCalledWith('/repos/haskell/aeson', 15000)
    expect(recordRepo).toHaveBeenCalledWith(qx, 'job-1', {
      repoUrl: 'https://github.com/haskell/aeson',
      confidence: 0.95,
    })
    expectUsageRecordedOnceBeforeGithub()
  })

  it('skips absent candidates and takes the next existing one', async () => {
    answered([
      { repositoryUrl: 'https://github.com/bos/aeson', confidence: 0.9 },
      { repositoryUrl: 'https://github.com/haskell/aeson', confidence: 0.8 },
    ])
    vi.mocked(githubApiGet)
      .mockResolvedValueOnce({ status: 404, text: null })
      .mockResolvedValueOnce({ status: 200, text: '{}' })

    await expect(resolveRepoViaLlm(input)).resolves.toMatchObject({
      outcome: 'resolved',
      repoUrl: 'https://github.com/haskell/aeson',
    })
  })

  it('is unresolvable with the last attempted url when every candidate is absent', async () => {
    answered([
      { repositoryUrl: 'https://github.com/a/one', confidence: 0.9 },
      { repositoryUrl: 'https://github.com/a/two', confidence: 0.8 },
    ])
    vi.mocked(githubApiGet).mockResolvedValue({ status: 404, text: null })

    await expect(resolveRepoViaLlm(input)).resolves.toEqual({
      outcome: 'unresolvable',
      reason: 'Repository not found on GitHub: https://github.com/a/two',
      repoUrl: 'https://github.com/a/two',
    })
    expectUsageRecordedOnceBeforeGithub()
    expect(recordRepo).not.toHaveBeenCalled()
  })

  it('is unresolvable below the confidence threshold without calling GitHub', async () => {
    answered([{ repositoryUrl: 'https://github.com/a/b', confidence: 0.4 }])

    await expect(resolveRepoViaLlm(input)).resolves.toEqual({
      outcome: 'unresolvable',
      reason: 'LLM confidence 0.4 below threshold 0.7',
      repoUrl: null,
    })
    expect(githubApiGet).not.toHaveBeenCalled()
    expectUsageRecordedOnceBeforeGithub()
  })

  it('quotes the highest candidate confidence when all are below the threshold', async () => {
    answered([
      { repositoryUrl: 'https://github.com/a/b', confidence: 0.4 },
      { repositoryUrl: 'https://github.com/a/c', confidence: 0.6 },
    ])

    await expect(resolveRepoViaLlm(input)).resolves.toMatchObject({
      reason: 'LLM confidence 0.6 below threshold 0.7',
    })
  })

  it('ignores lower-ranked candidates below the threshold', async () => {
    answered([
      { repositoryUrl: 'https://github.com/a/one', confidence: 0.9 },
      { repositoryUrl: 'https://github.com/a/two', confidence: 0.2 },
    ])
    vi.mocked(githubApiGet).mockResolvedValue({ status: 404, text: null })

    await expect(resolveRepoViaLlm(input)).resolves.toMatchObject({ outcome: 'unresolvable' })
    expect(githubApiGet).toHaveBeenCalledTimes(1)
  })

  it('is unresolvable for an unsupported host', async () => {
    answered([{ repositoryUrl: 'https://gitlab.com/a/b', confidence: 0.9 }])
    await expect(resolveRepoViaLlm(input)).resolves.toEqual({
      outcome: 'unresolvable',
      reason: 'Repository host not supported: gitlab.com',
      repoUrl: 'https://gitlab.com/a/b',
    })
    expectUsageRecordedOnceBeforeGithub()
  })

  it('is unresolvable with the attempted url when it is not recognised', async () => {
    answered([{ repositoryUrl: 'not a url', confidence: 0.9 }])
    await expect(resolveRepoViaLlm(input)).resolves.toEqual({
      outcome: 'unresolvable',
      reason: 'Repository URL not recognised: not a url',
      repoUrl: 'not a url',
    })
  })

  it('is unresolvable for an empty candidate list', async () => {
    answered([])
    await expect(resolveRepoViaLlm(input)).resolves.toEqual({
      outcome: 'unresolvable',
      reason: 'LLM returned no repository',
      repoUrl: null,
    })
    expectUsageRecordedOnceBeforeGithub()
  })

  it('is unresolvable for an unparseable answer and still records usage', async () => {
    vi.mocked(inferRepositoryCandidates).mockResolvedValue({
      status: 'unparseable',
      reason: 'LLM answer was not valid JSON',
      usage,
    })
    await expect(resolveRepoViaLlm(input)).resolves.toEqual({
      outcome: 'unresolvable',
      reason: 'LLM answer was not valid JSON',
      repoUrl: null,
    })
    expectUsageRecordedOnceBeforeGithub()
  })

  it('throws a retryable error when the GitHub existence check fails', async () => {
    answered([{ repositoryUrl: 'https://github.com/a/b', confidence: 0.9 }])
    vi.mocked(githubApiGet).mockRejectedValue(new Error('HTTP 502'))
    const error = await resolveRepoViaLlm(input).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe('HTTP 502')
    expect(error).not.toMatchObject({ nonRetryable: true })
    expectUsageRecordedOnceBeforeGithub()
    expect(recordRepo).not.toHaveBeenCalled()
  })

  it('fails before calling the LLM when the GitHub App config is missing', async () => {
    vi.mocked(getGithubAppConfig).mockImplementation(() => {
      throw new Error('Missing required environment variable: CROWD_GITHUB_PRIVATE_KEY')
    })
    await expect(resolveRepoViaLlm(input)).rejects.toThrow('CROWD_GITHUB_PRIVATE_KEY')
    expect(inferRepositoryCandidates).not.toHaveBeenCalled()
    expect(recordUsage).not.toHaveBeenCalled()
  })

  it('fails without retry when Bedrock credentials are missing', async () => {
    vi.mocked(getBedrockCredentials).mockReturnValue(null)
    const error = await resolveRepoViaLlm(input).catch((e: unknown) => e)
    expect(error).toMatchObject({
      message: 'Bedrock credentials are not configured',
      nonRetryable: true,
    })
    expect(inferRepositoryCandidates).not.toHaveBeenCalled()
  })
})
