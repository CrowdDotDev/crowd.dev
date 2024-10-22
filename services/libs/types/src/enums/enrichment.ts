export enum MemberEnrichmentSource {
  PROGAI = 'progai',
}

export interface IMemberEnrichmentSourceQueryInput {
  source: MemberEnrichmentSource
  cacheObsoleteAfterSeconds: number
}
