import { assertCredentialKind } from '../../types'
import type { Channel, Credential } from '../../types'

// Octolens' 500 req/hr budget is shared org-wide, not per-installation like GitHub —
// every octolens integration maps to the same single global channel, not one per repo/account.
export const OCTOLENS_GLOBAL_CHANNEL_ID = 'octolens-global'

export async function discoverOctolens(credential: Credential): Promise<Channel[]> {
  assertCredentialKind(credential, 'octolens-token')

  return [{ channelId: OCTOLENS_GLOBAL_CHANNEL_ID, channelName: OCTOLENS_GLOBAL_CHANNEL_ID }]
}
