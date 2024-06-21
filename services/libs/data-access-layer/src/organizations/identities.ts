import { RawQueryParser } from '@crowd/common'
import { QueryExecutor } from '../queryExecutor'
import { QueryOptions } from '../utils'
import { getOrgIdentities } from './organizations'
import { IDbOrgIdentity, IDbOrgIdentityInsertInput, IDbOrgIdentityUpdateInput } from './types'

export async function fetchOrgIdentities(
  qx: QueryExecutor,
  organizationId: string,
): Promise<IDbOrgIdentity[]> {
  return qx.select(
    `
      SELECT *
      FROM "organizationIdentities"
      WHERE "organizationId" = $(organizationId)
    `,
    {
      organizationId,
    },
  )
}

export async function fetchManyOrgIdentities(
  qx: QueryExecutor,
  organizationIds: string[],
  tenantId: string,
): Promise<{ organizationId: string; identities: IDbOrgIdentity[] }[]> {
  return qx.select(
    `
      SELECT
          oi."organizationId",
          JSONB_AGG(oi ORDER BY oi."createdAt") AS "identities"
      FROM "organizationIdentities" oi
      WHERE oi."organizationId" IN ($(organizationIds:csv))
        AND oi."tenantId" = $(tenantId)
      GROUP BY oi."organizationId"
    `,
    {
      organizationIds,
      tenantId,
    },
  )
}

export async function cleanUpOrgIdentities(
  qx: QueryExecutor,
  organizationId: string,
  tenantId: string,
) {
  return qx.result(
    `
      DELETE
      FROM "organizationIdentities"
      WHERE "organizationId" = $(organizationId)
        AND "tenantId" = $(tenantId)
    `,
    {
      organizationId,
      tenantId,
    },
  )
}

export async function updateOrgIdentityVerifiedFlag(
  qx: QueryExecutor,
  identity: IDbOrgIdentityUpdateInput,
): Promise<void> {
  await qx.result(
    `
    update "organizationIdentities" set verified = $(verified)
    where "organizationId" = $(organizationId) and "tenantId" = $(tenantId) and platform = $(platform) and value = $(value) and type = $(type)
    `,
    identity,
  )
}

export async function addOrgIdentity(qx: QueryExecutor, identity: IDbOrgIdentityInsertInput) {
  return qx.result(
    `
      INSERT INTO "organizationIdentities" (
        "organizationId",
        platform,
        value,
        type,
        verified,
        "sourceId",
        "tenantId",
        "integrationId",
        "createdAt"
      )
      VALUES ($(organizationId), $(platform), $(value), $(type), $(verified), $(sourceId), $(tenantId), $(integrationId), NOW())
      ON CONFLICT DO NOTHING;
    `,
    identity,
  )
}

export async function upsertOrgIdentities(
  qe: QueryExecutor,
  organizationId: string,
  tenantId: string,
  identities: IDbOrgIdentity[],
  integrationId?: string,
): Promise<void> {
  const existingIdentities = await getOrgIdentities(qe, organizationId, tenantId)
  const toCreate = []
  const toUpdate = []

  for (const i of identities) {
    const existing = existingIdentities.find(
      (ei) => ei.value === i.value && ei.platform === i.platform && ei.type === i.type,
    )
    if (!existing) {
      toCreate.push(i)
    } else if (existing && existing.verified !== i.verified) {
      toUpdate.push(i)
    }
  }

  if (toCreate.length > 0) {
    for (const i of toCreate) {
      // add the identity
      await addOrgIdentity(qe, {
        organizationId,
        tenantId,
        platform: i.platform,
        type: i.type,
        value: i.value,
        verified: i.verified,
        sourceId: i.sourceId,
        integrationId,
      })
    }
  }

  if (toUpdate.length > 0) {
    for (const i of toUpdate) {
      // update the identity
      await updateOrgIdentityVerifiedFlag(qe, {
        organizationId,
        tenantId,
        platform: i.platform,
        type: i.type,
        value: i.value,
        verified: i.verified,
      })
    }
  }
}

export enum OrgIdentityField {
  ORGANIZATION_ID = 'organizationId',
  PLATFORM = 'platform',
  SOURCE_ID = 'sourceId',
  TENANT_ID = 'tenantId',
  INTEGRATION_ID = 'integrationId',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  VERIFIED = 'verified',
  TYPE = 'type',
  VALUE = 'value',
}

export async function queryOrgIdentities<T extends OrgIdentityField[]>(
  qx: QueryExecutor,
  opts: QueryOptions<T> = {},
): Promise<{ [K in T[number]]: string }[]> {
  const params = {
    limit: opts.limit || 10,
    offset: opts.offset || 0,
  }
  if (!opts.fields) {
    opts.fields = Object.values(OrgIdentityField) as T
  }
  if (!opts.filter) {
    opts.filter = {}
  }

  const where = RawQueryParser.parseFilters(
    opts.filter,
    new Map<string, string>(Object.values(OrgIdentityField).map((field) => [field, field])),
    [],
    params,
    { pgPromiseFormat: true },
  )

  return qx.select(
    `
      SELECT
        ${opts.fields.join(',\n')}
      FROM "organizationIdentities"
      WHERE ${where}
      LIMIT $(limit)
      OFFSET $(offset)
    `,
    params,
  )
}
