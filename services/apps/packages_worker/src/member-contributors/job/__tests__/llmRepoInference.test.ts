import { beforeEach, describe, expect, it, vi } from 'vitest'

import { inferRepositoryCandidates } from '../llmRepoInference'

const { log } = vi.hoisted(() => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

vi.mock('@crowd/logging', () => ({ getServiceChildLogger: () => log }))

type ResponseBlock = { type: 'thinking'; thinking: string } | { type: 'text'; text: string }

function bedrockResponse(
  text: string | null,
  usage: unknown = { input_tokens: 300, output_tokens: 80 },
  stopReason = 'end_turn',
): string {
  const content: ResponseBlock[] = [{ type: 'thinking', thinking: '' }]
  if (text !== null) content.push({ type: 'text', text })
  return JSON.stringify({ content, usage, stop_reason: stopReason })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('inferRepositoryCandidates', () => {
  it('sends the purl to sonnet 5.5 and parses the ranked candidates from the first text block', async () => {
    const invoke = vi.fn().mockResolvedValue(
      bedrockResponse(
        JSON.stringify({
          candidates: [
            { repositoryUrl: 'https://github.com/haskell/aeson', confidence: 0.95 },
            { repositoryUrl: 'https://github.com/bos/aeson', confidence: 0.4 },
          ],
          rationale: 'aeson moved to the haskell org',
        }),
      ),
    )

    const result = await inferRepositoryCandidates('pkg:hackage/aeson', invoke)

    expect(invoke).toHaveBeenCalledTimes(1)
    const [modelId, body] = invoke.mock.calls[0]
    expect(modelId).toBe('us.anthropic.claude-sonnet-5-5')
    const parsed = JSON.parse(body)
    expect(Object.keys(parsed).sort()).toEqual([
      'anthropic_version',
      'max_tokens',
      'messages',
      'output_config',
      'system',
    ])
    expect(parsed.max_tokens).toBe(2048)
    expect(parsed.anthropic_version).toBe('bedrock-2023-05-31')
    expect(parsed.messages).toEqual([
      { role: 'user', content: [{ type: 'text', text: 'pkg:hackage/aeson' }] },
    ])
    expect(parsed.system).toContain('canonical source repository')
    expect(parsed.output_config).toEqual({ effort: 'low' })
    expect(result).toEqual({
      status: 'answered',
      candidates: [
        { repositoryUrl: 'https://github.com/haskell/aeson', confidence: 0.95 },
        { repositoryUrl: 'https://github.com/bos/aeson', confidence: 0.4 },
      ],
      usage: { inputTokens: 300, outputTokens: 80, costUsd: 300 * 0.000002 + 80 * 0.00001 },
    })
  })

  it('accepts a fenced JSON answer and caps candidates at three', async () => {
    const candidates = [1, 2, 3, 4].map((n) => ({
      repositoryUrl: `https://github.com/o/r${n}`,
      confidence: 0.9,
    }))
    const invoke = vi
      .fn()
      .mockResolvedValue(
        bedrockResponse('```json\n' + JSON.stringify({ candidates, rationale: '' }) + '\n```'),
      )
    const result = await inferRepositoryCandidates('pkg:conan/boost', invoke)
    expect(result.status).toBe('answered')
    if (result.status === 'answered') expect(result.candidates).toHaveLength(3)
  })

  it('reports an empty candidate list as answered', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValue(bedrockResponse(JSON.stringify({ candidates: [], rationale: 'unknown' })))
    await expect(inferRepositoryCandidates('pkg:conan/x', invoke)).resolves.toMatchObject({
      status: 'answered',
      candidates: [],
    })
  })

  it('reports unparseable when there is no text block, keeping the usage', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValue(bedrockResponse(null, { input_tokens: 10, output_tokens: 0 }))
    const result = await inferRepositoryCandidates('pkg:conan/x', invoke)
    expect(result).toMatchObject({
      status: 'unparseable',
      reason: 'LLM answer had no text content',
      usage: { inputTokens: 10, outputTokens: 0 },
    })
    expect(result.usage.costUsd).toBeCloseTo(10 * 0.000002, 12)
  })

  it('reports unparseable on invalid JSON', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValue(bedrockResponse('I think it is github.com/haskell/aeson'))
    await expect(inferRepositoryCandidates('pkg:conan/x', invoke)).resolves.toMatchObject({
      status: 'unparseable',
      reason: 'LLM answer was not valid JSON',
    })
  })

  it('reports unparseable when the JSON does not match the schema', async () => {
    const invoke = vi.fn().mockResolvedValue(
      bedrockResponse(
        JSON.stringify({
          candidates: [{ repositoryUrl: 'https://github.com/a/b', confidence: 1.7 }],
        }),
      ),
    )
    await expect(inferRepositoryCandidates('pkg:conan/x', invoke)).resolves.toMatchObject({
      status: 'unparseable',
      reason: 'LLM answer did not match the expected schema',
    })
  })

  it('logs the stop reason of the call', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValue(bedrockResponse(JSON.stringify({ candidates: [], rationale: 'unknown' })))
    await inferRepositoryCandidates('pkg:conan/x', invoke)
    expect(log.info).toHaveBeenCalledWith(
      expect.objectContaining({ stopReason: 'end_turn' }),
      'LLM repo inference call',
    )
  })

  it('rejects a truncated answer so the activity retries instead of marking it unresolvable', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValue(bedrockResponse('{"candidates": [', undefined, 'max_tokens'))
    await expect(inferRepositoryCandidates('pkg:conan/x', invoke)).rejects.toThrow(
      'LLM answer truncated at max_tokens',
    )
    expect(log.info).toHaveBeenCalledWith(
      expect.objectContaining({ stopReason: 'max_tokens', inputTokens: 300, outputTokens: 80 }),
      'LLM repo inference call',
    )
  })

  it('reports a refusal as unparseable, keeping the usage', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValue(bedrockResponse(null, { input_tokens: 20, output_tokens: 5 }, 'refusal'))
    const result = await inferRepositoryCandidates('pkg:conan/x', invoke)
    expect(result).toMatchObject({
      status: 'unparseable',
      reason: 'LLM refused to answer',
      usage: { inputTokens: 20, outputTokens: 5 },
    })
  })

  it.each([
    ['missing', undefined],
    ['non-numeric', { input_tokens: '300', output_tokens: 80 }],
    ['partial', { input_tokens: 300 }],
  ])('rejects a response whose usage envelope is %s', async (_label, usage) => {
    const invoke = vi
      .fn()
      .mockResolvedValue(
        JSON.stringify({ content: [{ type: 'text', text: '{}' }], usage, stop_reason: 'end_turn' }),
      )
    await expect(inferRepositoryCandidates('pkg:conan/x', invoke)).rejects.toThrow(
      'Bedrock response had no token usage',
    )
  })

  it('propagates transport errors', async () => {
    const invoke = vi.fn().mockRejectedValue(new Error('ThrottlingException'))
    await expect(inferRepositoryCandidates('pkg:conan/x', invoke)).rejects.toThrow(
      'ThrottlingException',
    )
  })
})
