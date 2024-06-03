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

export async function findLfxMembership(
  qx: QueryExecutor,
  {
    tenantId,
    segmentId,
    organizationId,
  }: { tenantId: string; segmentId: string; organizationId: string },
): Promise<LfxMembership | null> {
  return qx.selectOneOrNone(
    `
      SELECT *
      FROM "lfxMemberships"
      WHERE "tenantId" = $(tenantId)
        AND "segmentId" = $(segmentId)
        AND "organizationId" = $(organizationId)
      LIMIT 1
    `,
    { tenantId, segmentId, organizationId },
  )
}

export async function findManyLfxMemberships(
  qx: QueryExecutor,
  {
    tenantId,
    segmentIds,
    organizationIds,
  }: { tenantId: string; segmentIds: string[]; organizationIds: string[] },
): Promise<LfxMembership[]> {
  return qx.select(
    `
      SELECT *
      FROM "lfxMemberships"
      WHERE "tenantId" = $(tenantId)
        AND "segmentId" = ANY($(segmentIds)::UUID[])
        AND "organizationId" = ANY($(organizationIds)::UUID[])
    `,
    { tenantId, segmentIds, organizationIds },
  )
}

export async function hasLfxMembership(
  qx: QueryExecutor,
  {
    tenantId,
    organizationId,
    segmentId,
  }: { tenantId: string; organizationId: string; segmentId?: string },
): Promise<boolean> {
  const segmentClause = segmentId ? 'AND "segmentId" = $(segmentId)' : ''
  const result = await qx.selectOneOrNone(
    `
        SELECT 1
        FROM "lfxMemberships"
        WHERE "tenantId" = $(tenantId)
          ${segmentClause}
          AND "organizationId" = $(organizationId)
        LIMIT 1
      `,
    { tenantId, segmentId, organizationId },
  )
  return !!result
}
