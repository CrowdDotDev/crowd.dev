import { CrowdIntegrations } from '@/integrations/integrations-config';
import { withHttp } from '@/utils/string';
import { Organization } from '@/modules/organization/types/Organization';
import { Platform } from '@/shared/modules/platform/types/Platform';

export default ({
  organization,
  order,
}: {
  organization: Partial<Organization>;
  order: Platform[];
}) => {
  const {
    identities = [],
    emails = [],
    phoneNumbers = [],
  } = organization || {};

  const getIdentityHandles = (platform: string) => {
    const parsedIdentities = identities?.length ? identities : [];

    if (platform === Platform.CUSTOM) {
      const customPlatforms = parsedIdentities.filter(
        (i) => (!order.includes(i.platform) || i.platform === Platform.CUSTOM)
          && i.platform !== Platform.EMAIL
          && i.platform !== Platform.EMAILS,
      );

      return customPlatforms;
    }

    return parsedIdentities.filter((i) => i.platform === platform) || [];
  };

  const getIdentities = (): {
    [key: string]: {
      handle: string;
      link: string;
    }[];
  } => order.reduce((acc, p) => {
    const handles = getIdentityHandles(p);

    if (
      (p === Platform.CUSTOM || p === Platform.PHONE_NUMBERS)
        && handles.length
    ) {
      const sortedCustomIdentities = handles.sort((a, b) => {
        const platformComparison = a.platform.localeCompare(b.platform);

        if (platformComparison === 0) {
          // If platforms are equal, sort by name
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
          acc[i.platform] = [
            {
              handle: i.name,
              link: i.url ? withHttp(i.url) : null,
            },
          ];
        }
      });
    } else {
      const handlesValues = handles.map((i) => ({
        handle:
            CrowdIntegrations.getConfig(i.platform)?.organization?.handle(i)
            ?? i.name
            ?? CrowdIntegrations.getConfig(i.platform)?.name
            ?? i.platform,
        link: i.url ? withHttp(i.url) : null,
      }));

      if (handlesValues.length) {
        acc[p] = handlesValues;
      }
    }

    return acc;
  }, {});

  const getEmails = (): {
    handle: string;
    link: string;
  }[] => {
    const parsedIdentities = identities?.length ? identities : [];

    const rootEmails = (emails || [])
      .filter((e) => !!e)
      .map((e) => ({
        link: `mailto:${e}`,
        handle: e,
      }));

    const identitiesEmails = parsedIdentities
      .filter((i) => i.platform === 'emails')
      .map((i) => ({
        link: i.url ? `mailto:${i.url}` : null,
        handle: i.name,
      }));

    const identitiesEmail = parsedIdentities
      .filter((i) => i.platform === 'email')
      .map((i) => ({
        link: i.url ? `mailto:${i.url}` : null,
        handle: i.name,
      }));

    return [...rootEmails, ...identitiesEmails, ...identitiesEmail];
  };

  const getPhoneNumbers = (): {
    handle: string;
    link: string;
  }[] => (phoneNumbers || []).map((p) => ({
    link: `tel:${p}`,
    handle: p,
  }));

  return {
    getIdentities,
    getEmails,
    getPhoneNumbers,
  };
};
