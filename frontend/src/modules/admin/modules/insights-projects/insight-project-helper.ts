import { InsightsProjectAddFormModel } from './models/insights-project-add-form.model';
import { InsightsProjectModel } from './models/insights-project.model';
import { defaultWidgetsValues } from './widgets';

export const buildRequest = (form: InsightsProjectAddFormModel) => ({
  segmentId: form.segmentId,
  name: form.name,
  description: form.description,
  logoUrl: form.logoUrl,
  collections: form.collectionsIds,
  organizationId: form.organizationId,
  website: form.website,
  github: form.github,
  twitter: form.twitter,
  linkedin: form.linkedin,
  repositories: form.repositories
    .filter((repository: any) => repository.enabled)
    .map((repository: any) => repository.url),
  widgets: Object.keys(form.widgets).filter((key: string) => form.widgets[key]),
});

export const buildForm = (result: InsightsProjectModel, repositories: any): InsightsProjectAddFormModel => ({
  ...result,
  organizationId: result.organization.id,
  collectionsIds: result.collections.map((collection: any) => collection.id),
  repositories,
  // repositories:repositories.map((repository: any) => ({
  //     ...repository,
  //     enabled: result.repositories.some((repo: any) => repo.url === repository.url),
  // })),
  widgets: Object.keys(defaultWidgetsValues).reduce((acc, key: string) => ({
    ...acc,
    [key]: !!result.widgets.includes(key),
  }), {}),
});

/**
 *
 * {
  repositories: {
    url: string;
    enabled: boolean;
    platforms: string[];
  }[];
  widgets: {
    [key: string]: boolean;
  };
}
 *
 */
