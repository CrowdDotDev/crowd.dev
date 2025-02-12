import { CollectionModel } from '../../collections/models/collection.model';

export interface InsightsProjectModel {
  id: string;
  name: string;
  logoUrl: string;
  collections: CollectionModel[];
  organization: {
    id: string;
    displayName: string;
    logo: string;
  };
  starred: boolean;
  enabled: boolean;
}
