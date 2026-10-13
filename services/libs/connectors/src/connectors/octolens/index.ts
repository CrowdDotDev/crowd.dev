import type { Manifest } from '../../types'
import { discoverOctolens } from './discover'
import { octolensActivitySchema } from './mapper'
import { runMentionPoll } from './syncs/mentionPoll'

export const octolensConnector: Manifest = {
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
  ],
  discover: discoverOctolens,
}
