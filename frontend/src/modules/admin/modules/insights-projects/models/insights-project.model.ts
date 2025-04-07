import { CollectionModel } from '../../collections/models/collection.model';

export interface InsightsProjectModel {
  id: string;
  slug: string;
  segmentId: string;
  segment: {
    id: string;
    name: string;
    logo: string;
  };
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
  repositories: string[];
  widgets: string[];
  keywords: string[];
}
