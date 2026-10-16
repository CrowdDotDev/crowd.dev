import { z } from 'zod'

import { parseLlmJson } from '@crowd/common'
import type { LlmUsage } from '@crowd/data-access-layer/src/osspckgs/memberContributorJobs'
import { getServiceChildLogger } from '@crowd/logging'
import { LlmModelType, estimateLlmCostUsd } from '@crowd/types'

import type { BedrockInvoke } from '../../llm/bedrockClient'

const log = getServiceChildLogger('member-contributors:llm-repo-inference')

export const REPO_INFERENCE_MODEL_ID = LlmModelType.CLAUDE_SONNET_5_5
export const MAX_REPO_CANDIDATES = 3
const MAX_TOKENS = 512

const candidateSchema = z.object({
  repositoryUrl: z.string().min(1),
  confidence: z.number().min(0).max(1),
})
const answerSchema = z.object({
  candidates: z.array(candidateSchema),
  rationale: z.string().optional(),
})

const ANSWER_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['candidates', 'rationale'],
  properties: {
    candidates: {
      type: 'array',
      maxItems: MAX_REPO_CANDIDATES,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['repositoryUrl', 'confidence'],
        properties: {
          repositoryUrl: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
    rationale: { type: 'string' },
  },
}

const SYSTEM_PROMPT = `You resolve a software package, given as a package URL (purl, e.g. pkg:hackage/aeson or pkg:conan/boost), to its canonical source repository.
Rules:
- Answer only from what you know. Never invent a URL you have not seen.
- Return up to ${MAX_REPO_CANDIDATES} candidate GitHub repository URLs ranked by likelihood, each with a confidence between 0 and 1 that it is the package's canonical upstream source repository.
- Prefer the upstream project over forks, mirrors, packaging repositories and distribution recipes.
- If you do not know the repository, return an empty candidates list.
- rationale: one short sentence.
Respond ONLY with a single JSON object matching this JSON schema, no prose:
${JSON.stringify(ANSWER_JSON_SCHEMA)}`

export interface RepoCandidate {
  repositoryUrl: string
  confidence: number
}

export type RepoInference =
  | { status: 'answered'; candidates: RepoCandidate[]; usage: LlmUsage }
  | { status: 'unparseable'; reason: string; usage: LlmUsage }

interface BedrockMessageResponse {
  content?: Array<{ type?: string; text?: string }>
  usage?: { input_tokens?: number; output_tokens?: number }
}

function requestBody(purl: string): string {
  return JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: MAX_TOKENS,
    output_config: { effort: 'low' },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: [{ type: 'text', text: purl }] }],
  })
}

function usageOf(response: BedrockMessageResponse): LlmUsage {
  const inputTokens = response.usage?.input_tokens ?? 0
  const outputTokens = response.usage?.output_tokens ?? 0
  return {
    inputTokens,
    outputTokens,
    costUsd: estimateLlmCostUsd(REPO_INFERENCE_MODEL_ID, inputTokens, outputTokens),
  }
}

function firstText(response: BedrockMessageResponse): string | null {
  const block = response.content?.find(
    (entry) => entry.type === 'text' && typeof entry.text === 'string',
  )
  return block?.text ?? null
}

function parseAnswer(text: string): RepoCandidate[] | string {
  let raw: unknown
  try {
    raw = parseLlmJson<unknown>(text)
  } catch {
    return 'LLM answer was not valid JSON'
  }
  const parsed = answerSchema.safeParse(raw)
  if (!parsed.success) {
    return 'LLM answer did not match the expected schema'
  }
  return parsed.data.candidates.slice(0, MAX_REPO_CANDIDATES)
}

export async function inferRepositoryCandidates(
  purl: string,
  invoke: BedrockInvoke,
): Promise<RepoInference> {
  const startedAt = Date.now()
  const response = JSON.parse(
    await invoke(REPO_INFERENCE_MODEL_ID, requestBody(purl)),
  ) as BedrockMessageResponse
  const usage = usageOf(response)
  const text = firstText(response)
  const candidates = text === null ? 'LLM answer had no text content' : parseAnswer(text)
  log.info(
    {
      modelId: REPO_INFERENCE_MODEL_ID,
      purl,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      costUsd: usage.costUsd,
      candidates: typeof candidates === 'string' ? 0 : candidates.length,
      durationMs: Date.now() - startedAt,
    },
    'LLM repo inference call',
  )
  if (typeof candidates === 'string') {
    return { status: 'unparseable', reason: candidates, usage }
  }
  return { status: 'answered', candidates, usage }
}
