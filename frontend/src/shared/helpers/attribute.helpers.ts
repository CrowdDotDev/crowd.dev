import { CrowdIntegrations } from '@/integrations/integrations-config';
import { isEqual } from 'lodash';

export const getAttributeSources = (attribute: Record<string, string>): string[] => {
  const defaultValue: string | undefined = attribute.default;
  return Object.keys(attribute).filter((key) => key !== 'default' && isEqual(attribute[key], defaultValue));
};

export const getAttributeSourceName = (attribute: Record<string, string>): string | null => {
  const sources = getAttributeSources(attribute);
  if (sources.length === 0) {
    return null;
  }

  // Sort that integrations are first, then others like enrichment and last is custom
  const prioritySortedSources = sources.sort((a, b) => {
    const aConfig = !!CrowdIntegrations.getConfig(a)?.name;
    const bConfig = !!CrowdIntegrations.getConfig(b)?.name;

    if (a === 'custom') return 1; // 'custom' should be last
    if (b === 'custom') return -1; // 'custom' should be last

    if (aConfig && !bConfig) return -1; // a matches the criteria and b doesn't, a should come first
    if (!aConfig && bConfig) return 1; // b matches the criteria and a doesn't, b should come first

    return 0; // If both match or both don't match the criteria, keep their order
  });
  const selectedSource = prioritySortedSources[0];
  return CrowdIntegrations.getConfig(selectedSource)?.name ?? `${selectedSource.charAt(0).toUpperCase()}${selectedSource.substring(1)}`;
};
