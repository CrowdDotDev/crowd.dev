import { lfIdentities } from '@/config/identities/index';

const useIdentitiesHelpers = () => {
  const getPlatformsLabel = (platforms: string[]) => platforms
    .filter((platform) => !['integration_or_enrichment', 'email', 'integration', 'unknown', 'delete'].includes(platform))
    .map((platform) => {
      if (['enrichment', 'peopledatalabs'].includes(platform)) {
        return '<span class="ri-sparkling-line mr-0.5"></span> Enrichment';
      }
      if (platform === 'custom') {
        return 'Manually added';
      }
      return lfIdentities[platform]?.name || platform;
    }).join(', ');

  const uniqueKeys = () => [...new Set(Object.values(lfIdentities).map((identity) => identity.key))];

  const memberIdentities = uniqueKeys().map((key) => lfIdentities[key]).filter((identity) => identity.showInMembers);

  const organizationIdentities = uniqueKeys().map((key) => lfIdentities[key]).filter((identity) => identity.showInOrganizations);

  return {
    getPlatformsLabel,
    memberIdentities,
    organizationIdentities,
  };
};

export default useIdentitiesHelpers;
