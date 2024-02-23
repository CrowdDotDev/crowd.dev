import { DbTransaction } from '@crowd/database'
import { EnrichmentAPIMember } from '@crowd/types/src/premium'
import { generateUUIDv4 } from '@crowd/common'

export async function insertMemberIdentity(
  tx: DbTransaction,
  platform: string,
  memberId: string,
  tenantId: string,
  username: string,
) {
  return tx.query(
    `INSERT INTO "memberIdentities" ("memberId", "tenantId", platform, username)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT ON CONSTRAINT "memberIdentities_platform_username_tenantId_key" DO UPDATE
          SET username = EXCLUDED.username, "updatedAt" = NOW();`,
    [memberId, tenantId, platform, username],
  )
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
  tenantId: string,
  attributeName: string,
  attributeType: string,
  value: string,
  label: string,
  show: boolean,
  canDelete: boolean,
) {
  return tx.query(
    `INSERT INTO "memberAttributeSettings" (id, "tenantId", name, label, type, show, "canDelete", options, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          ON CONFLICT (name, "tenantId") DO UPDATE
          SET options = array_append("memberAttributeSettings".options, $9), "updatedAt" = NOW();`,
    [generateUUIDv4(), tenantId, attributeName, label, attributeType, show, canDelete, value],
  )
}

export async function insertMemberAttributeSettingsWithoutValue(
  tx: DbTransaction,
  tenantId: string,
  attributeName: string,
  attributeType: string,
  label: string,
  show: boolean,
  canDelete: boolean,
) {
  return tx.query(
    `INSERT INTO "memberAttributeSettings" (id, "tenantId", name, label, type, show, "canDelete", options, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          ON CONFLICT (name, "tenantId") DO NOTHING;`,
    [generateUUIDv4(), tenantId, attributeName, label, attributeType, show, canDelete],
  )
}
