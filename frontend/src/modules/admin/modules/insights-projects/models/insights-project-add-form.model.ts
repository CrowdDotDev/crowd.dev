import { CollectionModel } from '../../collections/models/collection.model';

export interface InsightsProjectAddFormModel {
    name: string;
    description: string;
    logo: string;
    collections: CollectionModel[];
    organizationId: string;
    website: string;
    github: string;
    twitter: string;
    linkedin: string;
    repositories: {
        url: string;
        enabled: boolean;
    }[];
    widgets: {
        name: string;
        enabled: boolean;
    }[];
}
