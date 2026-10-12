import { z } from 'zod'

import type { Manifest, SyncContext } from '../../types'
import { discoverOctolens } from './discover'

export const octolensConnector: Manifest = {
  platform: 'octolens',
  // No preparePool/mintToken/probeBudget: unlike GitHub's per-installation token rotation,
  // Octolens is one shared org-wide bearer token, so the dispatcher's auto-fetch (which only
  // triggers when one of those three is set, in syncRunActivities.ts) doesn't apply here.
  // discover() takes its credential as a parameter from whoever calls it (see discover.ts).
  // TODO(CM-1835 sync/mapper/emit step): SyncContext carries no QueryExecutor or
  // integrationId today, so the real run() below still needs a way to reach getCredential()
  // for its token — unresolved until that step is implemented.
  syncs: [
    {
      name: 'mentionPoll',
      cadenceMinutes: 5,
      schema: z.record(z.unknown()),
      // Stub: CM-1835's sync/mapper/emit step replaces this with the real
      // POST /api/v2/mentions poll. Never reached in any deployed environment — the
      // dispatcher only claims an octolens sync_unit once CM-1836 seeds one. Throws rather
      // than faking success so a wiring bug (a sync_unit claimed before CM-1836 ships)
      // surfaces loudly instead of silently reporting a no-op run as complete.
      run: async (_ctx: SyncContext) => {
        throw new Error('octolens mentionPoll not implemented yet (CM-1835)')
      },
    },
  ],
  discover: discoverOctolens,
}
