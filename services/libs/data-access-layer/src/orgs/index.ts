import { QueryExecutor } from '../queryExecutor'
import { QueryOptions, QueryResult, queryTable, queryTableById } from '../utils'

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

export async function queryOrgs<T extends OrganizationField>(
  qx: QueryExecutor,
  opts: QueryOptions<T>,
): Promise<QueryResult<T>[]> {
  return queryTable(qx, 'organizations', Object.values(OrganizationField), opts)
}

export async function findOrgById<T extends OrganizationField>(
  qx: QueryExecutor,
  orgId: string,
  fields: T[],
): Promise<QueryResult<T>> {
  return queryTableById(qx, 'organizations', Object.values(OrganizationField), orgId, fields)
}
