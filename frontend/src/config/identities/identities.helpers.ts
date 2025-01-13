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

  return {
    getPlatformsLabel,
  };
};

export default useIdentitiesHelpers;
