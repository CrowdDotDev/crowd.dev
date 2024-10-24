export enum MemberEnrichmentSource {
  PROGAI = 'progai',
  CLEARBIT = 'clearbit',
}

export interface IMemberEnrichmentSourceQueryInput {
  source: MemberEnrichmentSource
  cacheObsoleteAfterSeconds: number
}
