import { ProviderContractError } from '../../http/errors'
import { octolensGet } from './apiClient'

export interface OctolensNotification {
  id: number
  name: string
  enabled: boolean
  feedId: number
  destinations: OctolensDestination[]
}

export interface OctolensDestination {
  type: string
  webhookDestination?: { url: string }
}

export interface OctolensFilterCondition {
  field: string
  // Absent on simple filters, whose conditions always match inclusively (`in`).
  operator?: string
  values: string
}

export interface OctolensFeed {
  id: number
  name: string
  simpleFilters: { conditions: OctolensFilterCondition[] } | null
  advancedFilters: {
    top_level_operator: string
    groups: { group_operator: string; conditions: OctolensFilterCondition[] }[]
  } | null
}

export interface OctolensKeyword {
  id: number
  keyword: string
  paused: boolean
}

export async function fetchNotifications(token: string): Promise<OctolensNotification[]> {
  return listData(await octolensGet(token, '/notifications', 'notifications'), 'notifications')
}

export async function fetchFeeds(token: string): Promise<OctolensFeed[]> {
  return listData(await octolensGet(token, '/feeds', 'feeds'), 'feeds')
}

export async function fetchKeywords(token: string): Promise<OctolensKeyword[]> {
  return listData(await octolensGet(token, '/keywords', 'keywords'), 'keywords')
}

function listData<T>(body: unknown, what: string): T[] {
  const data = (body as { data?: unknown } | null)?.data
  if (!Array.isArray(data)) {
    throw new ProviderContractError(`octolens ${what} response missing data`)
  }
  return data as T[]
}
