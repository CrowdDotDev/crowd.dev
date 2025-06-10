import { CollectionModel } from '../../collections/models/collection.model';

export interface InsightsProjectAddFormModel {
  segmentId: string;
  name: string;
  description: string;
  logoUrl: string;
  collectionsIds: string[];
  collections: CollectionModel[];
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
  keywords: string[];
  repositories: {
    url: string;
    label: string;
    enabled: boolean;
    platforms: string[];
  }[];
  widgets: {
    [key: string]: {
      enabled: boolean;
      platform: string[];
    };
  };
}
