import { CrowdIntegrations } from '@/integrations/integrations-config';
import { withHttp } from '@/utils/string';
import { Organization } from '@/modules/organization/types/Organization';

export default ({ organization, order }: { organization: Partial<Organization>, order?: string[] }) => {
  const {
    identities = [], emails = [], phoneNumbers = [],
  } = (organization || {});

  const getPlatformIdentities = (platform: string) => {
    const parsedIdentities = identities?.length ? identities : [];

    if (platform === 'custom') {
      const customPlatforms = parsedIdentities
        .filter((i) => (!order.includes(i.platform) || i.platform === 'custom') && i.platform !== 'email' && i.platform !== 'emails');

      return customPlatforms;
    }

    return parsedIdentities.filter((i) => i.platform === platform) || [];
  };

  const getIdentities = (): {
    [key: string]: {
      handle: string;
      link: string;
    }[]
  } => order.reduce((acc, p) => {
    const platformIdentities = getPlatformIdentities(p);

    if ((p === 'custom' || p === 'phoneNumbers') && platformIdentities.length) {
      const sortedCustomIdentities = platformIdentities.sort((a, b) => {
        const platformComparison = a.platform.localeCompare(b.platform);

        if (platformComparison === 0) { // If platforms are equal, sort by name
          return a.name.localeCompare(b.name);
        }

        return platformComparison; // Otherwise, sort by platform
      });

      sortedCustomIdentities.forEach((i) => {
        if (acc[i.platform]?.length) {
          acc[i.platform].push({
            handle: i.name,
            link: i.url ? withHttp(i.url) : null,
          });
        } else {
          acc[i.platform] = [{
            handle: i.name,
            link: i.url ? withHttp(i.url) : null,
          }];
        }
      });
    } else {
      const platformIdentitiesValues = platformIdentities.map((i) => ({
        handle: CrowdIntegrations.getConfig(i.platform)?.organization?.handle(i)
              ?? i.name
              ?? CrowdIntegrations.getConfig(i.platform)?.name
              ?? i.platform,
        link: i.url ? withHttp(i.url) : null,
      }));

      if (platformIdentitiesValues.length) {
        acc[p] = platformIdentitiesValues;
      }
    }

    return acc;
  }, {});

  const getEmails = ():{
    handle: string;
    link: string;
  }[] => {
    const parsedIdentities = identities?.length ? identities : [];

    const rootEmails = (emails || []).map((e) => ({
      platform: 'emails',
      url: `mailto:${e}`,
      name: e,
    }));
    const identitiesEmails = parsedIdentities.filter((i) => i.platform === 'emails');
    const identitiesEmail = parsedIdentities.filter((i) => i.platform === 'email');

    return [...rootEmails, ...identitiesEmails, ...identitiesEmail];
  };

  const getPhoneNumbers = ():{
    handle: string;
    link: string;
  }[] => (phoneNumbers || []).map((p) => ({
    platform: 'phoneNumbers',
    url: `tel:${p}`,
    name: p,
  }));

  return {
    getIdentities,
    getEmails,
    getPhoneNumbers,
  };
};
