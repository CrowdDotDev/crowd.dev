import { CrowdIntegrations } from '@/integrations/integrations-config';
import { Member } from '@/modules/member/types/Member';
import { Platform } from '@/shared/modules/platform/types/Platform';

export default ({
  member,
  order,
}: {
  member: Partial<Member>;
  order: Platform[];
}) => {
  const {
    attributes = {}, identities,
  } = member || {};

  const getIdentityHandles = (platform: string) => {
    if (platform === Platform.CUSTOM) {
      const mainPlatforms = (Object.values(Platform) as string[]).filter((p) => p !== 'custom');
      return (identities || [])
        .filter((i) => !mainPlatforms.includes(i.platform) && i.type !== 'email')
        .map((i) => ({
          platform: i.platform,
          url: null,
          name: i.value,
          verified: i.verified,
        }));
    }
    return (identities || [])
      .filter((i) => i.platform === platform && i.type !== 'email')
      .map((i) => ({
        platform,
        url: null,
        name: i.value,
        verified: i.verified,
      }));
  };

  const getIdentityLink = (identity: {
    platform: string;
    url: string;
    name: string;
  }, platform: string) => {
    if (!CrowdIntegrations.getConfig(platform)?.showProfileLink) {
      return null;
    }

    return (
      identity.url
      ?? CrowdIntegrations.getConfig(platform)?.url({
        username: identity.name,
        attributes,
      })
      ?? attributes?.url?.[platform]
    );
  };

  const getIdentities = (): {
    [key: string]: {
      handle: string;
      link: string;
    }[];
  } => order.reduce((acc, platform) => {
    const handles = getIdentityHandles(platform);

    if (platform === Platform.CUSTOM && handles.length) {
      const sortedCustomIdentities = handles.sort((a, b) => {
        const platformComparison = a.platform.localeCompare(b.platform);

        if (platformComparison === 0) {
          // If platforms are equal, sort by name
          return a.name.localeCompare(b.name);
        }

        return platformComparison; // Otherwise, sort by platform
      });

      sortedCustomIdentities.forEach((identity) => {
        if (acc[identity.platform]?.length) {
          acc[identity.platform].push({
            handle: identity.name,
            link: getIdentityLink(identity, platform),
            verified: identity.verified,
          });
        } else {
          acc[identity.platform] = [
            {
              handle: identity.name,
              link: getIdentityLink(identity, platform),
              verified: identity.verified,
            },
          ];
        }
      });
    } else {
      const platformHandlesValues = handles.map((identity) => ({
        handle: identity.name,
        link: getIdentityLink(identity, platform),
        verified: identity.verified,
      }));

      if (platformHandlesValues.length) {
        acc[platform] = platformHandlesValues;
      }
    }

    return acc;
  }, {});

  const getEmails = (): {
    handle: string;
    link: string;
  }[] => (identities || [])
    .filter((i) => i.type === 'email')
    .map((i) => ({
      link: `mailto:${i.value}`,
      handle: i.value,
      verified: i.verified,
      platform: i.platform,
    }))
    .sort((a, b) => {
      const indexA = order.findIndex((p) => p === a.platform);
      const indexB = order.findIndex((p) => p === b.platform);

      const orderA = indexA === -1 ? order.length : indexA;
      const orderB = indexB === -1 ? order.length : indexB;

      return orderA - orderB;
    });

  return {
    getIdentities,
    getEmails,
  };
};
