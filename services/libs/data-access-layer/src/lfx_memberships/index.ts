import { QueryExecutor } from '../queryExecutor'

export interface LfxMembership {
  id?: string
  createdAt: Date
  updatedAt: Date
  tenantId: string
  organizationId?: string
  segmentId?: string
  accountName: string
  parentAccount: string
  project: string
  productName: string
  purchaseHistoryName: string
  installDate: Date
  usageEndDate: Date
  status: string
  priceCurrency: string
  price: number
  productFamily: string
  tier: string
  accountDomain: string
  domainAlias: string[]
}

export async function insertLfxMembership(qx: QueryExecutor, data: LfxMembership): Promise<void> {
  return qx.selectOneOrNone(
    `
      INSERT INTO "lfxMemberships" (
        "tenantId",
        "organizationId",
        "segmentId",
        "accountName",
        "parentAccount",
        "project",
        "productName",
        "purchaseHistoryName",
        "installDate",
        "usageEndDate",
        "status",
        "priceCurrency",
        "price",
        "productFamily",
        "tier",
        "accountDomain",
        "domainAlias"
      ) VALUES (
        $(tenantId),
        $(organizationId),
        $(segmentId),
        $(accountName),
        $(parentAccount),
        $(project),
        $(productName),
        $(purchaseHistoryName),
        $(installDate),
        $(usageEndDate),
        $(status),
        $(priceCurrency),
        $(price),
        $(productFamily),
        $(tier),
        $(accountDomain),
        $(domainAlias)
      )
      ON CONFLICT ("tenantId", "segmentId", "accountName") DO NOTHING
    `,
    data,
  )
}
