import { OpensearchField } from '@crowd/types'
import { OpensearchFieldType } from '@crowd/types'
import OpensearchModelBase from './base'

export class OrganizationsOpensearch extends OpensearchModelBase {
  fields: Record<string, OpensearchField> = {
    id: {
      type: OpensearchFieldType.UUID,
      customTranslation: {
        toOpensearch: 'uuid_organizationId',
        fromOpensearch: 'uuid_organizationId',
      },
    },
    segmentId: {
      type: OpensearchFieldType.UUID,
    },
    tenantId: {
      type: OpensearchFieldType.UUID,
    },
    address: {
      type: OpensearchFieldType.OBJECT,
    },
    logo: {
      type: OpensearchFieldType.STRING,
    },
    attributes: {
      type: OpensearchFieldType.STRING,
    },
    createdAt: {
      type: OpensearchFieldType.DATE,
    },
    description: {
      type: OpensearchFieldType.STRING,
    },
    displayName: {
      type: OpensearchFieldType.STRING,
    },
    emails: {
      type: OpensearchFieldType.STRING_ARR,
    },
    employeeCountByCountry: {
      type: OpensearchFieldType.OBJECT,
    },
    employees: {
      type: OpensearchFieldType.INT,
    },
    founded: {
      type: OpensearchFieldType.INT,
    },
    geoLocation: {
      type: OpensearchFieldType.STRING,
    },
    location: {
      type: OpensearchFieldType.STRING,
    },
    headline: {
      type: OpensearchFieldType.STRING,
    },
    industry: {
      type: OpensearchFieldType.STRING,
    },
    phoneNumbers: {
      type: OpensearchFieldType.STRING_ARR,
    },
    profiles: {
      type: OpensearchFieldType.STRING_ARR,
    },
    revenueRange: {
      type: OpensearchFieldType.OBJECT,
      preventNestedFieldTranslation: true,
    },
    size: {
      type: OpensearchFieldType.STRING,
    },
    type: {
      type: OpensearchFieldType.STRING,
    },
    website: {
      type: OpensearchFieldType.STRING,
    },
    linkedin: {
      type: OpensearchFieldType.OBJECT,
      preventNestedFieldTranslation: true,
    },
    github: {
      type: OpensearchFieldType.OBJECT,
      preventNestedFieldTranslation: true,
    },
    crunchbase: {
      type: OpensearchFieldType.OBJECT,
      preventNestedFieldTranslation: true,
    },
    twitter: {
      type: OpensearchFieldType.OBJECT,
      preventNestedFieldTranslation: true,
    },
    joinedAt: {
      type: OpensearchFieldType.DATE,
    },
    lastActive: {
      type: OpensearchFieldType.DATE,
    },
    activeOn: {
      type: OpensearchFieldType.STRING_ARR,
    },
    activityCount: {
      type: OpensearchFieldType.INT,
    },
    memberCount: {
      type: OpensearchFieldType.INT,
    },
    identities: {
      type: OpensearchFieldType.NESTED,
      customTranslation: {
        toOpensearch: 'nested_identities.string_name',
        fromOpensearch: 'nested_identities',
      },
    },
    isTeamOrganization: {
      type: OpensearchFieldType.BOOL,
    },
    manuallyCreated: {
      type: OpensearchFieldType.BOOL,
    },
    immediateParent: {
      type: OpensearchFieldType.STRING_ARR,
    },
    ultimateParent: {
      type: OpensearchFieldType.STRING_ARR,
    },
    affiliatedProfiles: {
      type: OpensearchFieldType.STRING_ARR,
    },
    allSubsidiaries: {
      type: OpensearchFieldType.STRING_ARR,
    },
    alternativeDomains: {
      type: OpensearchFieldType.STRING_ARR,
    },
    alternativeNames: {
      type: OpensearchFieldType.STRING_ARR,
    },
    averageEmployeeTenure: {
      type: OpensearchFieldType.FLOAT,
    },
    averageTenureByLevel: {
      type: OpensearchFieldType.OBJECT,
    },
    averageTenureByRole: {
      type: OpensearchFieldType.OBJECT,
    },
    directSubsidiaries: {
      type: OpensearchFieldType.STRING_ARR,
    },
    employeeChurnRate: {
      type: OpensearchFieldType.OBJECT,
    },
    employeeCountByMonth: {
      type: OpensearchFieldType.OBJECT,
    },
    employeeGrowthRate: {
      type: OpensearchFieldType.OBJECT,
    },
    employeeCountByMonthByLevel: {
      type: OpensearchFieldType.OBJECT,
    },
    employeeCountByMonthByRole: {
      type: OpensearchFieldType.OBJECT,
    },
    gicsSector: {
      type: OpensearchFieldType.STRING_ARR,
    },
    grossAdditionsByMonth: {
      type: OpensearchFieldType.OBJECT,
    },
    grossDeparturesByMonth: {
      type: OpensearchFieldType.OBJECT,
    },
  }
}
