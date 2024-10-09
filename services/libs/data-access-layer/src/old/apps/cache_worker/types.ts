export interface ISegment {
  segmentId: string
  slug: string
  parentSlug: string
  grandparentSlug: string
}

export interface IPlatforms {
  platforms: string[]
}

export interface IDashboardCacheLastRefreshedAt {
  dashboardCacheLastRefreshedAt: string
}
