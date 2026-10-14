import type { ZodType } from 'zod'

import type { Logger } from '@crowd/logging'

import type { EmitOverrides } from './emit'
import type { ConnectorHttp, ResponseInterpreter } from './http/client'
import type { BudgetProbe, TokenMinter, TokenPool } from './pool/tokenPool'

export interface Channel {
  channelId: string
  channelName: string
}

export interface GithubAppCredentialData {
  appId: string
  privateKey: string
}

export interface OctolensTokenCredentialData {
  token: string
}

export type Credential =
  | { platform: 'github'; kind: 'github-app'; data: GithubAppCredentialData }
  | { platform: 'octolens'; kind: 'octolens-token'; data: OctolensTokenCredentialData }

export function assertCredentialKind<K extends Credential['kind']>(
  credential: Credential,
  kind: K,
): asserts credential is Extract<Credential, { kind: K }> {
  if (credential.kind !== kind) {
    throw new Error(`expected ${kind} credential, got ${credential.kind}`)
  }
}

export interface SyncContext {
  channel: Channel
  integrationId: string
  watermark: Record<string, unknown> | null
  emit: (records: unknown[], overrides?: EmitOverrides) => Promise<void>
  commitWatermark: (watermark: Record<string, unknown>) => Promise<void>
  hasRunBudget: () => boolean
  http: ConnectorHttp
  log: Logger
  // Connectors without preparePool/mintToken (e.g. Octolens) get no credential via ctx.http's
  // token pool, so they fetch their own here instead.
  getCredential: () => Promise<Credential>
  // Octolens maps a mention's keywordId to a CDP segmentId per-record (unlike every other
  // connector, which has one fixed segmentId for the whole sync unit).
  resolveSegmentId: (keywordId: number) => Promise<string | null>
}

export interface SyncOutcome {
  complete: boolean
}

export interface SyncDefinition {
  name: string
  cadenceMinutes: number
  schema: ZodType<Record<string, unknown>>
  run: (ctx: SyncContext) => Promise<SyncOutcome>
}

export interface PoolPreparation {
  preferredEntryId?: string
}

export interface Manifest {
  platform: string
  syncs: SyncDefinition[]
  discover: (credential: Credential) => Promise<Channel[]>
  preparePool?: (credential: Credential, pool: TokenPool) => Promise<PoolPreparation>
  mintToken?: (credential: Credential) => TokenMinter
  probeBudget?: BudgetProbe
  interpretResponse?: ResponseInterpreter
}
