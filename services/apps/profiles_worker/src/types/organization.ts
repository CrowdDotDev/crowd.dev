export interface IOrganizationProfileSyncInput {
  tenantId: string
  organization: {
    id: string
  }
  syncOptions?: IOrganizationSyncOptions
  recalculateAffiliations?: boolean
  afterMemberId?: string
}

export interface IOrganizationSyncOptions {
  doSync: boolean
  withAggs: boolean
}
