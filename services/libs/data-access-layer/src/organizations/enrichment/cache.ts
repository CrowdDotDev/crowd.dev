import { IOrganizationEnrichmentCache, OrganizationEnrichmentSource } from '@crowd/types'

import { QueryExecutor } from '../../queryExecutor'

export async function insertOrganizationEnrichmentCache<T>(
  qx: QueryExecutor,
  organizationId: string,
  data: T,
  source: OrganizationEnrichmentSource,
): Promise<void> {
  await qx.result(
    `insert into "organizationEnrichmentCache" ("organizationId", "data", "source", "createdAt", "updatedAt")
        values ($(organizationId), $(data), $(source), now(), now())
        on conflict ("organizationId", "source") do update set "data" = $(data), "updatedAt" = now()`,
    { organizationId, data, source },
  )
}

export async function fetchOrganizationEnrichmentCache<T>(
  qx: QueryExecutor,
  organizationId: string,
  source: OrganizationEnrichmentSource[],
): Promise<IOrganizationEnrichmentCache<T>[]> {
  return qx.select(
    `select * from "organizationEnrichmentCache" where "organizationId" = $(organizationId) and "source" in ($(source:csv))`,
    { organizationId, source },
  )
}

export async function updateOrganizationEnrichmentCache<T>(
  qx: QueryExecutor,
  organizationId: string,
  data: T,
  source: OrganizationEnrichmentSource,
): Promise<void> {
  await qx.result(
    `update "organizationEnrichmentCache" set "data" = $(data), "updatedAt" = now() where "organizationId" = $(organizationId) and "source" = $(source)`,
    { organizationId, data, source },
  )
}

export async function setOrganizationEnrichmentCacheUpdatedAt(
  qx: QueryExecutor,
  organizationId: string,
  source: OrganizationEnrichmentSource,
): Promise<void> {
  await qx.result(
    `update "organizationEnrichmentCache" set "updatedAt" = now() where "organizationId" = $(organizationId) and "source" = $(source)`,
    { organizationId, source },
  )
}
