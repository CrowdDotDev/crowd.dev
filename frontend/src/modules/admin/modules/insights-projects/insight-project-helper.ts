import { InsightsProjectAddFormModel } from './models/insights-project-add-form.model';
import { InsightsProjectModel } from './models/insights-project.model';
import { defaultWidgetsValues } from './widgets';

export const buildRequest = (form: InsightsProjectAddFormModel) => ({
  segmentId: form.segmentId,
  name: form.name,
  slug: form.slug,
  description: form.description,
  logoUrl: form.logoUrl,
  collections: form.collectionsIds,
  organizationId: form.organizationId,
  website: form.website,
  github: form.github,
  twitter: form.twitter,
  linkedin: form.linkedin,
  repositories: form.repositories?.filter((r) => r.enabled).map((r) => r.url),
  widgets: Object.keys(form.widgets).filter((key: string) => form.widgets[key]),
});

export const buildForm = (
  result: InsightsProjectModel,
  repositories: any[],
): InsightsProjectAddFormModel => ({
  ...result,
  organizationId: result.organization.id,
  collectionsIds: result.collections.map((collection: any) => collection.id),
  repositories:
    repositories?.map((repository: any) => ({
      ...repository,
      enabled: result.repositories?.some(
        (repo: any) => repo.url === repository.url,
      ),
    })) || [],
  widgets: Object.keys(defaultWidgetsValues).reduce(
    (acc, key: string) => ({
      ...acc,
      [key]: !!result.widgets.includes(key),
    }),
    {},
  ),
});

export const buildRepositories = (res: Record<string, Array<{ url: string; label: string }>>) => {
  const urlMap = new Map<string, {
    url: string;
    label: string;
    enabled: boolean;
    platforms: string[];
  }>();

  // Iterate through each platform (git, github, gitlab, gerrit)
  Object.entries(res).forEach(([platform, repos]) => {
    // Process each repository from the platform
    repos.forEach((repo) => {
      if (urlMap.has(repo.url)) {
        // If URL exists, add the platform to its platforms array
        const existing = urlMap.get(repo.url)!;
        existing.platforms.push(platform);
      } else {
        // If URL is new, create a new entry
        urlMap.set(repo.url, {
          url: repo.url,
          label: repo.label,
          enabled: true,
          platforms: [platform],
        });
      }
    });
  });

  return Array.from(urlMap.values());
};
