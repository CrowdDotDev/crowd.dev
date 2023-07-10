export interface Organization{
  activeOn: string[];
  activityCount: number;
  address: Record<string, string>;
  createdAt: string;
  createdById: string;
  crunchbase: Record<string, string> | null;
  deletedAt: string;
  description: string;
  displayName: string;
  emails: string[] | null;
  employeeCountByCountry: Record<string, number> | null;
  employees: number | null;
  founded: string | null;
  geoLocation: string | null;
  github: Record<string, string> | null;
  headline: string;
  id: string;
  identities: string[];
  importHash: string | null;
  industry: string;
  isTeamOrganization: boolean;
  joinedAt: string;
  lastActive: string;
  lastEnrichedAt: string;
  linkedin: Record<string, string> | null;
  location: string;
  logo: string;
  memberCount: number;
  naics: any[]
  name: string;
  parentUrl: string | null;
  phoneNumbers: string[] | null;
  profiles: string[];
  revenueRange: string | null;
  size: string;
  tags: string[] | null;
  tenantId: string;
  ticker: Record<string, string> | null;
  twitter: Record<string, string> | null;
  type: string;
  updatedAt: string;
  updatedById: string;
  url: string;
  website: string;
  memberOrganizations: {
    title: string;
    dateStart: string;
    dateEnd: string;
  }
}
