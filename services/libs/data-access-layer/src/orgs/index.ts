import { RawQueryParser } from '@crowd/common'
import { QueryExecutor } from '../queryExecutor'
import { QueryOptions } from '../utils'

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

export async function queryOrgs<T extends OrganizationField[]>(
  qx: QueryExecutor,
  { filter, fields, limit, offset }: QueryOptions<T> = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ [K in T[number]]: any }[]> {
  const params = {
    limit: limit || 10,
    offset: offset || 0,
  }
  if (!fields) {
    fields = Object.values(OrganizationField) as T
  }
  if (!filter) {
    filter = {}
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
        ${fields.map((f) => `"${f}"`).join(',\n')}
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ [K in T[number]]: any }> {
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
