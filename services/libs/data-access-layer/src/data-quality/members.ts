import { IMemberOrganization } from '@crowd/types'
import { QueryExecutor } from '../queryExecutor'

export async function fetchMembersWithoutWorkExperience(
  qx: QueryExecutor,
  tenantId: string,
  limit: number,
  offset: number,
): Promise<IMemberOrganization[]> {
  return qx.select(
    `
        SELECT m.id, m."displayName"
        FROM public.members m
                 LEFT JOIN public."memberOrganizations" mo ON m.id = mo."memberId"
        WHERE mo."memberId" IS NULL
          AND m."tenantId" = ${tenantId}
          AND m."deletedAt" IS NULL
        LIMIT ${limit} OFFSET ${offset};
    `,
    {
      tenantId,
      limit,
      offset,
    },
  )
}

export async function fetchMembersWithTooManyIdentities(
  qx: QueryExecutor,
  treshold = 10,
  tenantId: string,
  limit: number,
  offset: number,
): Promise<IMemberOrganization[]> {
  return qx.select(
    `
        SELECT mi."memberId", COUNT(*) AS identity_count
        FROM public."memberIdentities" mi
                 JOIN public.members m ON mi."memberId" = m.id
        WHERE m."tenantId" = ${tenantId}
        GROUP BY mi."memberId"
        HAVING COUNT(*) > ${treshold}
        LIMIT ${limit} OFFSET ${offset};
    `,
    {
      treshold,
      tenantId,
      limit,
      offset,
    },
  )
}

export async function fetchMembersWithTooManyIdentitiesPerPlatform(
  qx: QueryExecutor,
  treshold = 1,
  tenantId: string,
  limit: number,
  offset: number,
): Promise<IMemberOrganization[]> {
  return qx.select(
    `
        SELECT mi."memberId", mi.platform, COUNT(*) AS identity_count
        FROM public."memberIdentities" mi
                 JOIN public.members m ON mi."memberId" = m.id
        WHERE m."tenantId" = ${tenantId}
        GROUP BY mi."memberId", mi.platform
        HAVING COUNT(*) > ${treshold}
        LIMIT ${limit} OFFSET ${offset};
    `,
    {
      treshold,
      tenantId,
      limit,
      offset,
    },
  )
}
