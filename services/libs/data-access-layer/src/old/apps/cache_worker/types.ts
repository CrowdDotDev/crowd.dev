export interface ITenant {
  tenantId: string
  plan: string
}

export interface ISegment {
  id: string
  segmentId: string
  slug: string
  name: string
  parentName: string
  parentSlug: string
  grandparentSlug: string
}

export interface IPlatforms {
  platforms: string[]
}

export interface IDashboardCacheLastRefreshedAt {
  dashboardCacheLastRefreshedAt: string
}
