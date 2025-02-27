import { DEFAULT_TENANT_ID } from '@crowd/common'

import { QueryExecutor } from '../queryExecutor'

export interface LfxMembership {
  id?: string
  createdAt: Date
  updatedAt: Date
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
    { tenantId: DEFAULT_TENANT_ID, ...data },
  )
}

export async function findLfxMembership(
  qx: QueryExecutor,
  { organizationId }: { organizationId: string },
): Promise<LfxMembership | null> {
  return qx.selectOneOrNone(
    `
      SELECT *
      FROM "lfxMemberships"
      WHERE "organizationId" = $(organizationId)
      LIMIT 1
    `,
    { organizationId },
  )
}

export async function findManyLfxMemberships(
  qx: QueryExecutor,
  { organizationIds }: { organizationIds: string[] },
): Promise<LfxMembership[]> {
  return qx.select(
    `
      SELECT *
      FROM "lfxMemberships"
      WHERE "organizationId" = ANY($(organizationIds)::UUID[])
    `,
    { organizationIds },
  )
}

export async function hasLfxMembership(
  qx: QueryExecutor,
  { organizationId, segmentId }: { organizationId: string; segmentId?: string },
): Promise<boolean> {
  const segmentClause = segmentId ? '"segmentId" = $(segmentId)' : '1=1'
  const result = await qx.selectOneOrNone(
    `
        SELECT 1
        FROM "lfxMemberships"
        WHERE ${segmentClause}
          AND "organizationId" = $(organizationId)
        LIMIT 1
      `,
    { segmentId, organizationId },
  )
  return !!result
}
