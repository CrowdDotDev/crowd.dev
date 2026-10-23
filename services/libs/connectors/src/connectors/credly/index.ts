import type { Manifest } from '../../types'
import { discoverCredly } from './discover'
import { createCredlyTokenMinter, prepareCredlyPool } from './oauth'

export const credlyConnector: Manifest = {
  platform: 'credly',
  syncs: [],
  discover: discoverCredly,
  preparePool: prepareCredlyPool,
  mintToken: createCredlyTokenMinter,
}
