import { CollectionModel } from '../../collections/models/collection.model';

export interface InsightsProjectModel {
  id: string;
  segmentId: string;
  name: string;
  description: string;
  logoUrl: string;
  collections: CollectionModel[];
  organization: {
    id: string;
    displayName: string;
    logo: string;
  };
  website: string;
  github: string;
  twitter: string;
  linkedin: string;
  starred: boolean;
  enabled: boolean;
  repositories: {
    url: string;
    enabled: boolean;
    platforms: string[];
  }[];
  widgets: string[];
}
