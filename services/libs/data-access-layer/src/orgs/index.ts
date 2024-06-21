import { IOrganizationPartialAggregatesRawResult } from './types'
import { QueryExecutor } from '../queryExecutor'
import { IOrganization } from '@crowd/types'
import { RawQueryParser } from '@crowd/common'

export enum OrganizationField {
  // meta
  ID = 'id',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  DELETED_AT = 'deletedAt',
  CREATED_BY_ID = 'createdById',
  UPDATED_BY_ID = 'updatedById',
  TENANT_ID = 'tenantId',

  IMPORT_HASH = 'importHash',
  LAST_ENRICHED_AT = 'lastEnrichedAt',
  MANUALLY_CREATED = 'manuallyCreated',

  DESCRIPTION = 'description',
  LOGO = 'logo',
  TAGS = 'tags',
  EMPLOYEES = 'employees',
  REVENUE_RANGE = 'revenueRange',
  LOCATION = 'location',
  IS_TEAM_ORGANIZATION = 'isTeamOrganization',
  TYPE = 'type',
  SIZE = 'size',
  HEADLINE = 'headline',
  INDUSTRY = 'industry',
  FOUNDED = 'founded',
  DISPLAY_NAME = 'displayName',
  EMPLOYEE_CHURN_RATE = 'employeeChurnRate',
  EMPLOYEE_GROWTH_RATE = 'employeeGrowthRate',
}

export async function findOrgsForMergeSuggestions(
  qx: QueryExecutor,
  tenantId: string,
  batchSize: number,
  afterOrganizationId?: string,
  lastGeneratedAt?: string,
): Promise<IOrganizationPartialAggregatesRawResult[]> {
  let filter = ''
  if (afterOrganizationId) {
    filter += `AND o.id > $(afterOrganizationId)`
  }

  if (lastGeneratedAt) {
    filter += 'AND o."createdAt" > $(lastGeneratedAt)'
  }

  return qx.select(
    `
      SELECT
        o.id,
        json_agg(oi) as identities,
        ARRAY_AGG(DISTINCT onm."noMergeId") AS "noMergeIds",
        o."displayName",
        o.location,
        o.industry,
        o.ticker,
        osa."activityCount"
      FROM organizations o
      JOIN "organizationSegmentsAgg" osa ON o.id = osa."organizationId"
      JOIN "organizationNoMerge" onm ON onm."organizationId" = o.id
      JOIN "organizationIdentities" oi ON o.id = oi."organizationId"
      WHERE o."tenantId" = $(tenantId)
        ${filter}
      GROUP BY o.id, osa.id
      ORDER BY o.id
      LIMIT $(batchSize)
    `,
    {
      tenantId,
      batchSize,
      afterOrganizationId,
      lastGeneratedAt,
    },
  )
}

export type IPlainOrg = Map<OrganizationField, any> // eslint-disable-line @typescript-eslint/no-explicit-any

export async function queryOrgs<T extends OrganizationField[]>(
  qx: QueryExecutor,
  {
    filter,
    fields,
    limit,
    offset,
  }: {
    filter?: any // eslint-disable-line @typescript-eslint/no-explicit-any
    fields?: T
    limit?: number
    offset?: number
  } = {
    filter: {},
    fields: Object.values(OrganizationField) as T,
    limit: 10,
    offset: 0,
  },
): Promise<[{ [K in T[number]]: string }]> {
  const params = {
    limit,
    offset,
  }
  const where = RawQueryParser.parseFilters(
    filter,
    new Map<string, string>(Object.values(OrganizationField).map((field) => [field, field])),
    [],
    params,
    { pgPromiseFormat: true },
  )

  return qx.select(
    `
      SELECT
        ${fields.join(',\n')}
      FROM organizations
      WHERE ${where}
      LIMIT $(limit)
      OFFSET $(offset)
    `,
    params,
  )
}

export async function findOrgById<T extends OrganizationField[]>(
  qx: QueryExecutor,
  organizationId: string,
  {
    fields,
  }: {
    fields?: T
  } = {
    fields: Object.values(OrganizationField) as T,
  },
): Promise<{ [K in T[number]]: string }> {
  const rows = await queryOrgs(qx, {
    fields,
    filter: {
      [OrganizationField.ID]: { eq: organizationId },
    },
    limit: 1,
  })

  if (rows.length > 0) {
    return rows[0]
  }

  return null
}
