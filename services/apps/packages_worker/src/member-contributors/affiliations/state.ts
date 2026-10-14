import type {
  IdentityKey,
  MergeCounts,
} from '@crowd/data-access-layer/src/osspckgs/identityAffiliations'

import type { ChunkMethodCounts } from './counts'

export interface IdentityAffiliationsState {
  runStartedAt: string
  identities: number
  afterKey: IdentityKey | null
  counts: ChunkMethodCounts
}

export interface IdentityAffiliationsRunCounts extends MergeCounts {
  identities: number
}
