import { ITenantId } from 'types'
import { svc } from '../main'

export async function getAllTenants(): Promise<ITenantId[]> {
  let rows: ITenantId[] = []
  try {
    rows = await svc.postgres.reader.connection().query(`
      SELECT id as "tenantId"
      FROM tenants WHERE "deletedAt" IS NULL;
    `)
  } catch (err) {
    throw new Error(err)
  }

  return rows
}
