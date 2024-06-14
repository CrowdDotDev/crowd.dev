import { QueryExecutor } from '../queryExecutor'

export interface IOrgAttribute {
  id?: string
  createdAt: string
  updatedAt: string
  organizationId: string
  type: string
  name: string
  source: string
  default: boolean
  value?: string
}

export async function findOrgAttributes(qx: QueryExecutor, organizationId: string) {
  return qx.select(
    `
    SELECT
      *
    FROM "orgAttributes"
    WHERE "organizationId" = $(organizationId)
  `,
    {
      organizationId,
    },
  )
}
