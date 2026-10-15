import type { Manifest } from '../../types'
import { createOctolensDeps } from './deps'
import type { OctolensDeps } from './deps'
import { discoverOctolens } from './discover'
import { octolensActivitySchema } from './mapper'
import { runMappingDiscovery } from './syncs/mappingDiscovery'
import { runMentionPoll } from './syncs/mentionPoll'

export const octolensConnector: Manifest<OctolensDeps> = {
  platform: 'octolens',
  // Octolens shares one org-wide bearer token (no per-installation rotation), so unlike
  // GitHub this manifest sets no preparePool/mintToken/probeBudget.
  syncs: [
    {
      name: 'mentionPoll',
      cadenceMinutes: 5,
      schema: octolensActivitySchema,
      run: runMentionPoll,
    },
    {
      // New projects and webhooks appear rarely; 3 requests an hour leaves the shared budget alone.
      // It emits no activities, so the schema is only there to satisfy SyncDefinition.
      name: 'mappingDiscovery',
      cadenceMinutes: 60,
      schema: octolensActivitySchema,
      run: runMappingDiscovery,
    },
  ],
  discover: discoverOctolens,
  createDeps: createOctolensDeps,
}
