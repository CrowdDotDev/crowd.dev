import { isEqual } from 'lodash';
import { lfIdentities } from '@/config/identities';
import useIdentitiesHelpers from '@/config/identities/identities.helpers';

export const getAttributeSources = (attribute: Record<string, string>): string[] => {
  const defaultValue: string | undefined = attribute.default;
  return Object.keys(attribute).filter((key) => !['default'].includes(key) && isEqual(attribute[key], defaultValue));
};

export const getAttributeSourceName = (attribute: Record<string, string>): string | null => {
  if (!attribute) {
    return null;
  }
  const sources = getAttributeSources(attribute);
  if (sources.length === 0) {
    return null;
  }

  // Sort that integrations are first, then others like enrichment and last is custom
  const prioritySortedSources = sources.sort((a, b) => {
    const aConfig = !!lfIdentities[a]?.name;
    const bConfig = !!lfIdentities[b]?.name;

    if (aConfig && !bConfig) return -1; // a matches the criteria and b doesn't, a should come first
    if (!aConfig && bConfig) return 1; // b matches the criteria and a doesn't, b should come first

    return 0; // If both match or both don't match the criteria, keep their order
  });
  const { getPlatformsLabel } = useIdentitiesHelpers();
  const selectedSource = prioritySortedSources[0];
  return getPlatformsLabel([selectedSource]);
};
