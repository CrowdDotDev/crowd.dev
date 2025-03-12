export interface InsightsProjectAddFormModel {
  segmentId: string;
  name: string;
  description: string;
  logoUrl: string;
  collectionsIds: string[];
  organizationId: string | undefined;
  slug: string;
  organization: {
    id: string | undefined;
    displayName: string;
    logo: string;
  };
  website: string;
  github: string;
  twitter: string;
  linkedin: string;
  repositories: {
    url: string;
    label: string;
    enabled: boolean;
    platforms: string[];
  }[];
  widgets: {
    [key: string]: boolean;
  };
}
