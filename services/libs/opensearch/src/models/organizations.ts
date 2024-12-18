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
    grandParentSegment: {
      type: OpensearchFieldType.BOOL,
    },
    tenantId: {
      type: OpensearchFieldType.UUID,
    },
    address: {
      type: OpensearchFieldType.OBJECT,
      preventNestedFieldTranslation: true,
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
    names: {
      type: OpensearchFieldType.STRING_ARR,
    },
    tags: {
      type: OpensearchFieldType.STRING_ARR,
    },
    naics: {
      type: OpensearchFieldType.OBJECT,
      preventNestedFieldTranslation: true,
    },
    ticker: {
      type: OpensearchFieldType.STRING,
    },
    employeeCountByCountry: {
      type: OpensearchFieldType.OBJECT,
      preventNestedFieldTranslation: true,
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
    revenueRangeMin: {
      type: OpensearchFieldType.INT,
    },
    revenueRangeMax: {
      type: OpensearchFieldType.INT,
    },
    size: {
      type: OpensearchFieldType.STRING,
    },
    type: {
      type: OpensearchFieldType.STRING,
    },
    joinedAt: {
      type: OpensearchFieldType.DATE,
    },
    lastEnrichedAt: {
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
    },
    isTeamOrganization: {
      type: OpensearchFieldType.BOOL,
    },
    manuallyCreated: {
      type: OpensearchFieldType.BOOL,
    },
    immediateParent: {
      type: OpensearchFieldType.STRING,
    },
    ultimateParent: {
      type: OpensearchFieldType.STRING,
    },
    allSubsidiaries: {
      type: OpensearchFieldType.STRING_ARR,
    },
    alternativeNames: {
      type: OpensearchFieldType.STRING_ARR,
    },
    averageEmployeeTenure: {
      type: OpensearchFieldType.FLOAT,
      preventNestedFieldTranslation: true,
    },
    averageTenureByLevel: {
      type: OpensearchFieldType.OBJECT,
      preventNestedFieldTranslation: true,
    },
    averageTenureByRole: {
      type: OpensearchFieldType.OBJECT,
      preventNestedFieldTranslation: true,
    },
    directSubsidiaries: {
      type: OpensearchFieldType.STRING_ARR,
    },
    employeeChurnRate: {
      type: OpensearchFieldType.OBJECT,
      preventNestedFieldTranslation: true,
    },
    employeeCountByMonth: {
      type: OpensearchFieldType.OBJECT,
      preventNestedFieldTranslation: true,
    },
    employeeGrowthRate: {
      type: OpensearchFieldType.OBJECT,
      preventNestedFieldTranslation: true,
    },
    employeeCountByMonthByLevel: {
      type: OpensearchFieldType.OBJECT,
      preventNestedFieldTranslation: true,
    },
    employeeCountByMonthByRole: {
      type: OpensearchFieldType.OBJECT,
      preventNestedFieldTranslation: true,
    },
    gicsSector: {
      type: OpensearchFieldType.STRING,
    },
    grossAdditionsByMonth: {
      type: OpensearchFieldType.OBJECT,
      preventNestedFieldTranslation: true,
    },
    grossDeparturesByMonth: {
      type: OpensearchFieldType.OBJECT,
      preventNestedFieldTranslation: true,
    },
    employeeChurnRate12Month: {
      type: OpensearchFieldType.FLOAT,
    },
    employeeGrowthRate12Month: {
      type: OpensearchFieldType.FLOAT,
    },
    manuallyChangedFields: {
      type: OpensearchFieldType.STRING_ARR,
    },
  }
}
