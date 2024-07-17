import { Platform } from '@/shared/modules/platform/types/Platform';

export interface OrganizationAttribute extends Record<string, any[]>{
  default: any;
}

export enum OrganizationSource {
  EMAIL_DOMAIN = 'email-domain',
  ENRICHMENT = 'enrichment',
  HUBSPOT = 'hubspot',
  GITHUB = 'github',
  UI = 'ui',
}

export enum OrganizationIdentityType {
  USERNAME = 'username',
  PRIMARY_DOMAIN = 'primary-domain',
  ALTERNATIVE_DOMAIN = 'alternative-domain',
  AFFILIATED_PROFILE = 'affiliated-profile',
  EMAIL = 'email',
}

export interface OrganizationIdentity {
    organizationId?: string;
    platform: Platform;
    type: OrganizationIdentityType;
    value: string;
    verified: boolean;
    sourceId?: string;
    tenantId?: string;
    integrationId?: string;
}

export interface Organization {
  attributes: Record<string, OrganizationAttribute>,
  activeOn: string[];
  activityCount: number;
  address: Record<string, string>;
  createdAt: string;
  createdById: string;
  deletedAt: string;
  description: string;
  displayName: string;
  emails: string[] | null;
  employeeCountByCountry: Record<string, number> | null;
  employees: number | null;
  founded: string | null;
  geoLocation: string | null;
  headline: string;
  id: string;
  identities: OrganizationIdentity[];
  importHash: string | null;
  industry: string;
  isTeamOrganization: boolean;
  joinedAt: string;
  lastActive: string;
  lastEnrichedAt: string;
  location: string;
  logo: string;
  memberCount: number;
  naics: any[]
  name: string;
  phoneNumbers: string[] | null;
  profiles: string[];
  revenueRange: string | null;
  size: string;
  tags: string[] | null;
  tenantId: string;
  ticker: Record<string, string> | null;
  type: string;
  updatedAt: string;
  updatedById: string;
  url: string;
  memberOrganizations: {
    title: string;
    dateStart?: string;
    dateEnd?: string;
    source: OrganizationSource;
  }
  lfxMembership?: {
    accountDomain: string;
    accountName: string;
    createdAt: string;
    domainAlias: string[];
    id: string;
    installDate: string;
    organizationId: string;
    parentAccount: string;
    price: number;
    priceCurrency: string;
    productFamily: string;
    productName: string;
    project: string;
    purchaseHistoryName: string;
    segmentId: string;
    status: string;
    tenantId: string;
    tier: string;
    updatedAt: string;
    usageEndDate: string;
  }
}
