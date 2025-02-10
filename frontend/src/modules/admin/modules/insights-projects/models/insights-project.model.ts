import { CollectionModel } from '../../collections/models/collection.model';

export interface InsightsProjectModel {
  id: string;
  name: string;
  logoUrl: string;
  collections: CollectionModel[];
  organization: {
    name: string;
    logoUrl: string;
  };
  starred: boolean;
  enabled: boolean;
}
