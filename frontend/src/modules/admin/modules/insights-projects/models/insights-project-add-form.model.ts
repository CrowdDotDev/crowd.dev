export interface InsightsProjectAddFormModel {
  segmentId: string;
  name: string;
  description: string;
  logoUrl: string;
  collectionsIds: string[];
  organizationId: string | undefined;
  website: string;
  github: string;
  twitter: string;
  linkedin: string;
  repositories: {
    url: string;
    enabled: boolean;
    platforms: string[];
  }[];
  widgets: {
    [key: string]: boolean;
  };
}
