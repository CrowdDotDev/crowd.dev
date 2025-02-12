export interface InsightsProjectAddFormModel {
    name: string;
    description: string;
    logoUrl: string;
    collectionsIds: string[];
    organizationId: string;
    website: string;
    github: string;
    twitter: string;
    linkedin: string;
    repositories: {
        url: string;
        enabled: boolean;
        platforms: string[]
    }[];
    widgets: {
        [key: string]: boolean;
    };
}
