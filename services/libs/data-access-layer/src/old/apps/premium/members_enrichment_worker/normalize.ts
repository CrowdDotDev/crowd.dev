import { DbTransaction } from '@crowd/database'
import { EnrichmentAPIMember } from '@crowd/types/src/premium'
import { generateUUIDv4 } from '@crowd/common'
import { upsertMemberIdentity } from '../../../../member_identities'
import { PgPromiseQueryExecutor } from '../../../../queryExecutor'
import { MemberIdentityType } from '@crowd/types'

export async function insertMemberIdentity(
  tx: DbTransaction,
  platform: string,
  memberId: string,
  tenantId: string,
  value: string,
  type: MemberIdentityType,
  verified: boolean,
) {
  return upsertMemberIdentity(new PgPromiseQueryExecutor(tx), {
    memberId,
    tenantId,
    platform,
    value,
    type,
    verified,
  })
}

export async function insertMemberEnrichmentCache(
  tx: DbTransaction,
  data: EnrichmentAPIMember,
  memberId: string,
) {
  return tx.query(
    `INSERT INTO "memberEnrichmentCache" ("memberId", "data", "createdAt", "updatedAt")
      VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT ("memberId") DO UPDATE
      SET data = EXCLUDED.data, "updatedAt" = NOW();`,
    [memberId, JSON.stringify(data)],
  )
}

export async function setMemberAttributeSettings(
  tx: DbTransaction,
  options: string[],
  id: string,
  tenantId: string,
) {
  return tx.query(
    `UPDATE "memberAttributeSettings"
        SET options = $1
        WHERE id = $2 AND "tenantId" = $3;`,
    [options, id, tenantId],
  )
}

export async function updateMemberAttributeSettings(
  tx: DbTransaction,
  tenantId: string,
  attributeName: string,
  option: string,
) {
  return tx.query(
    `UPDATE "memberAttributeSettings"
          SET options = array_append(options, $1), "updatedAt" = NOW()
          WHERE name = $2 AND "tenantId" = $3
          AND $1 <> ALL(options);`,
    [option, attributeName, tenantId],
  )
}

export async function insertMemberAttributeSettings(
  tx: DbTransaction,
  attributeName: string,
  tenantId: string,
  label: string,
  attributeType: string,
  show: boolean,
  options: string,
) {
  return tx.query(
    `INSERT INTO "memberAttributeSettings" (id, "tenantId", name, label, type, show, "canDelete", options, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
        ON CONFLICT (name,"tenantId") DO UPDATE
        SET options = EXCLUDED.options, "updatedAt" = $9;`,
    [
      generateUUIDv4(),
      tenantId,
      attributeName,
      label,
      attributeType,
      show,
      false,
      options,
      new Date(Date.now()),
    ],
  )
}
