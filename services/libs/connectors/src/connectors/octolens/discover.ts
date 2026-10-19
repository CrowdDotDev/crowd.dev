import { assertCredentialKind } from '../../types'
import type { Channel, Credential } from '../../types'

// Octolens' 500 req/hr budget is shared org-wide, not per-installation like GitHub, so there
// is one global channel: only the segment-less anchor integration owns it (and the single
// mentionPoll sync unit); the per-subproject Octolens integrations own no sync units.
export const OCTOLENS_GLOBAL_CHANNEL_ID = 'octolens-global'

export async function discoverOctolens(credential: Credential): Promise<Channel[]> {
  assertCredentialKind(credential, 'octolens-token')

  return [{ channelId: OCTOLENS_GLOBAL_CHANNEL_ID, channelName: OCTOLENS_GLOBAL_CHANNEL_ID }]
}
