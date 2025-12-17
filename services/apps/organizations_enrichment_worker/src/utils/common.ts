import isEqual from 'lodash.isequal'

import { IOrganizationEnrichmentCache } from '@crowd/types'

import { IOrganizationEnrichmentData } from '../types'

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

export function sourceHasDifferentDataComparedToCache(
  cache: IOrganizationEnrichmentCache<IOrganizationEnrichmentData>,
  data: IOrganizationEnrichmentData,
): boolean {
  return !cache || !isEqual(data, cache.data)
}
