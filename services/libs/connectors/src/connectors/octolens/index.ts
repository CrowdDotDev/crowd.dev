import { z } from 'zod'

import type { Manifest, SyncContext } from '../../types'
import { discoverOctolens } from './discover'

export const octolensConnector: Manifest = {
  platform: 'octolens',
  // Octolens shares one org-wide bearer token (no per-installation rotation), so unlike
  // GitHub this manifest sets no preparePool/mintToken/probeBudget.
  // TODO(CM-1835): SyncContext has no QueryExecutor/integrationId, so the real run() below
  // still needs a way to reach getCredential() for the token.
  syncs: [
    {
      name: 'mentionPoll',
      cadenceMinutes: 5,
      schema: z.record(z.unknown()),
      // Stub for CM-1835's sync step — throws instead of faking { complete: true } so a
      // dispatcher wiring bug surfaces loudly instead of being silently masked.
      run: async (_ctx: SyncContext) => {
        throw new Error('octolens mentionPoll not implemented yet (CM-1835)')
      },
    },
  ],
  discover: discoverOctolens,
}
