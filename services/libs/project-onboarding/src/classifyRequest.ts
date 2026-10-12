import { getErrorMessage } from '@crowd/common'

import {
  ClassificationNode,
  IClassificationTrace,
  createClassificationTrace,
  toClassificationNode,
  traceLookups,
} from './classificationTrace'
import {
  IParsedOnboardingRequest,
  OnboardingRequestLlm,
  parseOnboardingRequest,
} from './requestParser'
import {
  IOnboardingRequestLookups,
  OnboardingResolution,
  resolveOnboardingRequest,
} from './requestResolver'

export interface IRequestClassificationDeps {
  queryLlm: OnboardingRequestLlm
  lookups: IOnboardingRequestLookups
}

export interface IRequestClassification {
  resolution: OnboardingResolution
  node: ClassificationNode
  trace: IClassificationTrace
}

export type ParsedRequestSource = () => Promise<
  { ok: true; request: IParsedOnboardingRequest } | { ok: false; reason: string }
>

export function unresolved(reason: string): OnboardingResolution {
  return { kind: 'ambiguous', reason, candidates: [] }
}

export async function resolveWithTrace(
  parse: ParsedRequestSource,
  lookups: IOnboardingRequestLookups,
  trace: IClassificationTrace,
): Promise<OnboardingResolution> {
  try {
    const parsed = await parse()
    if (parsed.ok === false) {
      trace.failure = { stage: 'parse', reason: parsed.reason }
      return unresolved(`Request could not be parsed: ${parsed.reason}`)
    }

    trace.parsed = parsed.request
    return await resolveOnboardingRequest(parsed.request, traceLookups(lookups, trace))
  } catch (err) {
    const reason = getErrorMessage(err)
    trace.failure = { stage: 'resolve', reason }
    return unresolved(`Classification failed: ${reason}`)
  }
}

export async function classifyOnboardingRequest(
  requestText: string,
  deps: IRequestClassificationDeps,
): Promise<IRequestClassification> {
  const trace = createClassificationTrace()
  const resolution = await resolveWithTrace(
    () => parseOnboardingRequest(requestText, deps.queryLlm),
    deps.lookups,
    trace,
  )

  return { resolution, node: toClassificationNode(resolution), trace }
}
