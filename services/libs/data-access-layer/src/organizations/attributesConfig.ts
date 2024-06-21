import { OrganizationAttributeSource, OrganizationAttributeType } from '@crowd/types'

export interface OrgAttributeDef {
  name: string
  incomingType: OrganizationAttributeType | 'string_array' | 'object_array'
  type: OrganizationAttributeType
  defaultColumn?: string
}

export const ORG_DB_FIELDS = [
  'description',
  'displayName',
  'logo',
  'tags',
  'employees',
  'revenueRange',
  'importHash',
  'location',
  'isTeamOrganization',
  'type',
  'size',
  'headline',
  'industry',
  'founded',
  'employeeChurnRate',
  'employeeGrowthRate',
]

export const ORG_DB_ATTRIBUTES: OrgAttributeDef[] = [
  {
    name: 'names',
    incomingType: 'string_array',
    type: OrganizationAttributeType.STRING,
    defaultColumn: 'displayName',
  },
  {
    name: 'description',
    incomingType: OrganizationAttributeType.STRING,
    type: OrganizationAttributeType.STRING,
    defaultColumn: 'description',
  },
  {
    name: 'logo',
    incomingType: OrganizationAttributeType.STRING,
    type: OrganizationAttributeType.STRING,
    defaultColumn: 'logo',
  },
  {
    name: 'location',
    incomingType: OrganizationAttributeType.STRING,
    type: OrganizationAttributeType.STRING,
    defaultColumn: 'location',
  },
  {
    name: 'type',
    incomingType: OrganizationAttributeType.STRING,
    type: OrganizationAttributeType.STRING,
    defaultColumn: 'type',
  },
  {
    name: 'employees',
    incomingType: OrganizationAttributeType.INTEGER,
    type: OrganizationAttributeType.INTEGER,
    defaultColumn: 'employees',
  },
  {
    name: 'revenueRange',
    incomingType: OrganizationAttributeType.OBJECT,
    type: OrganizationAttributeType.OBJECT,
    defaultColumn: 'revenueRange',
  },
  {
    name: 'size',
    incomingType: OrganizationAttributeType.STRING,
    type: OrganizationAttributeType.STRING,
    defaultColumn: 'size',
  },
  {
    name: 'headline',
    incomingType: OrganizationAttributeType.STRING,
    type: OrganizationAttributeType.STRING,
    defaultColumn: 'headline',
  },
  {
    name: 'industry',
    incomingType: OrganizationAttributeType.STRING,
    type: OrganizationAttributeType.STRING,
    defaultColumn: 'industry',
  },
  {
    name: 'founded',
    incomingType: OrganizationAttributeType.INTEGER,
    type: OrganizationAttributeType.INTEGER,
    defaultColumn: 'founded',
  },
  {
    name: 'employeeChurnRate',
    incomingType: OrganizationAttributeType.OBJECT,
    type: OrganizationAttributeType.OBJECT,
    defaultColumn: 'employeeChurnRate',
  },
  {
    name: 'employeeGrowthRate',
    incomingType: OrganizationAttributeType.OBJECT,
    type: OrganizationAttributeType.OBJECT,
    defaultColumn: 'employeeGrowthRate',
  },
  {
    name: 'phoneNumbers',
    incomingType: 'string_array',
    type: OrganizationAttributeType.STRING,
  },
  {
    name: 'geoLocation',
    incomingType: OrganizationAttributeType.STRING,
    type: OrganizationAttributeType.STRING,
  },
  {
    name: 'ticker',
    incomingType: OrganizationAttributeType.STRING,
    type: OrganizationAttributeType.STRING,
  },
  {
    name: 'profiles',
    incomingType: 'string_array',
    type: OrganizationAttributeType.STRING,
  },
  {
    name: 'address',
    incomingType: OrganizationAttributeType.OBJECT,
    type: OrganizationAttributeType.OBJECT,
  },
  {
    name: 'allSubsidiaries',
    incomingType: 'string_array',
    type: OrganizationAttributeType.STRING,
  },
  {
    name: 'alternativeNames',
    incomingType: 'string_array',
    type: OrganizationAttributeType.STRING,
  },
  {
    name: 'averageEmployeeTenure',
    incomingType: OrganizationAttributeType.DECIMAL,
    type: OrganizationAttributeType.DECIMAL,
  },
  {
    name: 'averageTenureByLevel',
    incomingType: OrganizationAttributeType.OBJECT,
    type: OrganizationAttributeType.OBJECT,
  },
  {
    name: 'averageTenureByRole',
    incomingType: OrganizationAttributeType.OBJECT,
    type: OrganizationAttributeType.OBJECT,
  },
  {
    name: 'directSubsidiaries',
    incomingType: 'string_array',
    type: OrganizationAttributeType.STRING,
  },
  {
    name: 'employeeCountByMonth',
    incomingType: OrganizationAttributeType.OBJECT,
    type: OrganizationAttributeType.OBJECT,
  },
  {
    name: 'employeeCountByCountry',
    incomingType: OrganizationAttributeType.OBJECT,
    type: OrganizationAttributeType.OBJECT,
  },
  {
    name: 'employeeCountByMonthByLevel',
    incomingType: OrganizationAttributeType.OBJECT,
    type: OrganizationAttributeType.OBJECT,
  },
  {
    name: 'employeeCountByMonthByRole',
    incomingType: OrganizationAttributeType.OBJECT,
    type: OrganizationAttributeType.OBJECT,
  },
  {
    name: 'gicsSector',
    incomingType: OrganizationAttributeType.STRING,
    type: OrganizationAttributeType.STRING,
  },
  {
    name: 'grossAdditionsByMonth',
    incomingType: OrganizationAttributeType.OBJECT,
    type: OrganizationAttributeType.OBJECT,
  },
  {
    name: 'grossDeparturesByMonth',
    incomingType: OrganizationAttributeType.OBJECT,
    type: OrganizationAttributeType.OBJECT,
  },
  {
    name: 'ultimateParent',
    incomingType: OrganizationAttributeType.STRING,
    type: OrganizationAttributeType.STRING,
  },
  {
    name: 'immediateParent',
    incomingType: OrganizationAttributeType.STRING,
    type: OrganizationAttributeType.STRING,
  },
  {
    name: 'naics',
    incomingType: 'object_array',
    type: OrganizationAttributeType.OBJECT,
  },
]

export const ORG_DB_ATTRIBUTE_SOURCE_PRIORITY = [
  OrganizationAttributeSource.CUSTOM,
  OrganizationAttributeSource.PDL,
  OrganizationAttributeSource.EMAIL,
  OrganizationAttributeSource.GITHUB,
]
