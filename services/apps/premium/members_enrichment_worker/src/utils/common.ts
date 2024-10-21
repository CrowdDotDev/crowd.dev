import { IMemberEnrichmentCache } from '@crowd/types/src/premium'
import lodash from 'lodash'
import { IMemberEnrichmentData } from '../types'

export function sourceHasDifferentDataComparedToCache(
  cache: IMemberEnrichmentCache,
  data: IMemberEnrichmentData,
): boolean {
  return !cache || !lodash.isEqual(data, cache.data)
}
