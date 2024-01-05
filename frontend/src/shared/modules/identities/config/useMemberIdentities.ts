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
  const { username = {}, attributes = {}, emails = [] } = member || {};

  const getIdentityHandles = (platform: string) => {
    if (platform === Platform.CUSTOM) {
      const customPlatforms = Object.keys(username).filter(
        (p) => (!order.includes(p) || p === Platform.CUSTOM)
          && p !== Platform.EMAIL
          && p !== Platform.EMAILS,
      );

      return customPlatforms.flatMap((p) => username[p].map((u) => ({
        platform: p,
        url: null,
        name: u,
      })));
    }

    return username[platform]
      ? username[platform].map((u) => ({
        platform,
        url: null,
        name: u,
      }))
      : [];
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
          });
        } else {
          acc[identity.platform] = [
            {
              handle: identity.name,
              link: getIdentityLink(identity, platform),
            },
          ];
        }
      });
    } else {
      const platformHandlesValues = handles.map((identity) => ({
        handle: identity.name,
        link: getIdentityLink(identity, platform),
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
  }[] => {
    const rootEmails = (emails || [])
      .filter((e) => !!e)
      .map((e) => ({
        link: `mailto:${e}`,
        handle: e,
      }));

    const usernameEmail = username.email
      ? username.email
        .filter((e) => !!e)
        .map((e) => ({
          link: null,
          handle: e,
        }))
      : [];

    const usernameEmails = username.emails
      ? username.emails
        .filter((e) => !!e)
        .map((e) => ({
          link: `mailto:${e}`,
          handle: e,
        }))
      : [];

    return [...rootEmails, ...usernameEmail, ...usernameEmails];
  };

  return {
    getIdentities,
    getEmails,
  };
};
