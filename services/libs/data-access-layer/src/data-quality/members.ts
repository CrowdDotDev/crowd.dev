import { IMember } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

/**
 * Fetches members who do not have any work experience.
 *
 * @param {QueryExecutor} qx - The query executor for running SQL queries.
 * @param {string} tenantId - The ID of the tenant to fetch members for.
 * @param {number} limit - The maximum number of members to return.
 * @param {number} offset - The number of members to skip before starting to collect the result set.
 * @param {string} segmentId - The segment ID to filter members by.
 * @return {Promise<IMember[]>} A promise that resolves to an array of members without work experience.
 */
export async function fetchMembersWithoutWorkExperience(
  qx: QueryExecutor,
  tenantId: string,
  limit: number,
  offset: number,
  segmentId: string,
): Promise<IMember[]> {
  return qx.select(
    `
        SELECT m.id, m."displayName", m.attributes, msa."activityCount"
        FROM members m
                 LEFT JOIN "memberOrganizations" mo ON m.id = mo."memberId"
                 LEFT JOIN "memberSegmentsAgg" msa ON m.id = msa."memberId" AND msa."segmentId" = '${segmentId}'
        WHERE mo."memberId" IS NULL
          AND m."tenantId" = '${tenantId}'
          AND m."deletedAt" IS NULL
        ORDER BY msa."activityCount" DESC
        LIMIT ${limit} OFFSET ${offset};
    `,
    {
      segmentId,
      tenantId,
      limit,
      offset,
    },
  )
}

/**
 * Fetches members with a number of identities that exceed a specified threshold.
 *
 * @param {QueryExecutor} qx - The query executor to perform database operations.
 * @param {number} [treshold=15] - The threshold for the number of identities a member must exceed to be included in the results.
 * @param {string} tenantId - The ID of the tenant whose members are being queried.
 * @param {number} limit - The maximum number of members to return.
 * @param {number} offset - The number of members to skip before starting to collect the result set.
 * @param {string} segmentId - The ID of the segment within which the activity count is considered.
 * @return {Promise<IMember[]>} A promise that resolves to an array of members who have more identities than the specified threshold.
 */
export async function fetchMembersWithTooManyIdentities(
  qx: QueryExecutor,
  treshold = 15,
  tenantId: string,
  limit: number,
  offset: number,
  segmentId: string,
): Promise<IMember[]> {
  return qx.select(
    `
        SELECT
            mi."memberId",
            m."displayName",
            m."attributes",
            m.id,
            COUNT(*) AS "identityCount",
            msa."activityCount"
        FROM "memberIdentities" mi
                 JOIN "members" m ON mi."memberId" = m.id
                 LEFT JOIN "memberSegmentsAgg" msa ON m.id = msa."memberId" AND msa."segmentId" = '${segmentId}'
        WHERE m."tenantId" = '${tenantId}'
        GROUP BY mi."memberId", m."displayName", m."attributes", m.id, msa."activityCount"
        HAVING COUNT(*) > ${treshold}
        ORDER BY msa."activityCount" DESC
        LIMIT ${limit} OFFSET ${offset};
    `,
    {
      treshold,
      tenantId,
      limit,
      offset,
      segmentId,
    },
  )
}

/**
 * Fetches members with a number of verified identities per platform exceeding a specified threshold for a given tenant.
 *
 * @param {QueryExecutor} qx - The query executor to run the database queries.
 * @param {number} [treshold=1] - The minimum number of verified identities per platform to filter members by. Defaults to 1.
 * @param {string} tenantId - The ID of the tenant to filter members.
 * @param {number} limit - The maximum number of records to return.
 * @param {number} offset - The number of records to skip.
 * @param {string} segmentId - The segment ID to fetch the member activity count.
 * @return {Promise<IMember[]>} A promise that resolves to an array of members matching the criteria.
 */
export async function fetchMembersWithTooManyIdentitiesPerPlatform(
  qx: QueryExecutor,
  treshold = 1,
  tenantId: string,
  limit: number,
  offset: number,
  segmentId: string,
): Promise<IMember[]> {
  return qx.select(
    `
        WITH platform_identities AS (
            SELECT
                mi."memberId",
                mi.platform,
                COUNT(*) AS "identityCount"
            FROM "memberIdentities" mi
                     JOIN "members" m ON mi."memberId" = m.id
            WHERE m."tenantId" = '${tenantId}' AND mi.type = 'username' AND mi.verified = true
            GROUP BY mi."memberId", mi.platform
            HAVING COUNT(*) > ${treshold}
        )
        SELECT
            p."memberId",
            m."displayName",
            m."attributes",
            m.id,
            STRING_AGG(p.platform, ',') AS platforms,
            msa."activityCount"
        FROM platform_identities p
                 JOIN "members" m ON p."memberId" = m.id
                 LEFT JOIN "memberSegmentsAgg" msa ON m.id = msa."memberId" AND msa."segmentId" = '${segmentId}'
        GROUP BY p."memberId", m."displayName", m."attributes", m.id, msa."activityCount"
        ORDER BY msa."activityCount" DESC
        LIMIT ${limit} OFFSET ${offset};
    `,
    {
      treshold,
      tenantId,
      limit,
      offset,
      segmentId,
    },
  )
}

export async function fetchMembersWithTooManyEmails(
  qx: QueryExecutor,
  threshold = 3,
  tenantId: string,
  limit: number,
  offset: number,
  segmentId: string,
): Promise<IMember[]> {
  return qx.select(
    `
            SELECT
                mi."memberId",
                m."displayName",
                m."attributes",
                m.id,
                COUNT(*) AS "identityCount",
                msa."activityCount"
            FROM "memberIdentities" mi
                     JOIN "members" m ON mi."memberId" = m.id
                     LEFT JOIN "memberSegmentsAgg" msa ON m.id = msa."memberId" AND msa."segmentId" = '${segmentId}'
            WHERE m."tenantId" = '${tenantId}'
              AND mi.verified = true
              AND mi.type = 'email'
            GROUP BY mi."memberId", m."displayName", m."attributes", m.id, msa."activityCount"
            HAVING COUNT(*) > ${threshold}
            ORDER BY msa."activityCount" DESC
            LIMIT ${limit} OFFSET ${offset};
        `,
    {
      threshold,
      tenantId,
      limit,
      offset,
      segmentId,
    },
  )
}

export async function fetchMembersWithIncompleteWorkExperience(
  qx: QueryExecutor,
  tenantId: string,
  limit: number,
  offset: number,
  segmentId: string,
): Promise<IMember[]> {
  return qx.select(
    `
          SELECT
              m.id,
              m."displayName",
              m."attributes",
              msa."activityCount",
              COUNT(mo.id) AS "organizationsCount"
          FROM "members" m
                   JOIN "memberOrganizations" mo ON m.id = mo."memberId"
                   LEFT JOIN "memberSegmentsAgg" msa ON m.id = msa."memberId" AND msa."segmentId" = '${segmentId}'
          WHERE m."tenantId" = '${tenantId}'
            AND (mo."title" IS NULL OR mo."title" = '' OR mo."dateStart" IS NULL)
          GROUP BY m.id, msa."activityCount"
          ORDER BY msa."activityCount" DESC
          LIMIT ${limit} OFFSET ${offset};
      `,
    {
      tenantId,
      limit,
      offset,
      segmentId,
    },
  )
}
