export interface IOrganizationAffiliationUpdateInput {
  tenantId: string
  organization: {
    id: string
  }
  syncToOpensearch?: boolean
}
