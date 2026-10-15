import type { Manifest } from '../../types'
import { createOctolensDeps } from './deps'
import type { OctolensDeps } from './deps'
import { discoverOctolens } from './discover'
import { octolensActivitySchema } from './mapper'
import { runMentionPoll } from './syncs/mentionPoll'

export const octolensConnector: Manifest<OctolensDeps> = {
  platform: 'octolens',
  // Octolens shares one org-wide bearer token (no per-installation rotation), so unlike
  // GitHub this manifest sets no preparePool/mintToken/probeBudget.
  // Keyword→project mapping discovery runs outside the sync units, on its own connectors_worker
  // schedule, because it creates the integrations the poll emits under.
  syncs: [
    {
      name: 'mentionPoll',
      cadenceMinutes: 5,
      schema: octolensActivitySchema,
      run: runMentionPoll,
    },
  ],
  discover: discoverOctolens,
  createDeps: createOctolensDeps,
  emitsOwnSegment: true,
}
