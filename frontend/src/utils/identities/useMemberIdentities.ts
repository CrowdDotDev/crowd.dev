import { CrowdIntegrations } from '@/integrations/integrations-config';
import { Member } from '@/modules/member/types/Member';

export default ({ member, order }: { member: Partial<Member>, order?: string[] }) => {
  const { username = {}, attributes = {}, emails = [] } = (member || {});

  const getPlatformHandles = (platform: string) => {
    if (platform === 'custom') {
      const customPlatforms = Object.keys(username).filter((p) => (!order.includes(p) || p === 'custom') && p !== 'email' && p !== 'emails');

      return customPlatforms.flatMap((p) => username[p].map((u) => ({
        platform: p,
        url: null,
        name: u,
      })));
    }

    return username[platform] ? username[platform].map((u) => ({
      platform,
      url: null,
      name: u,
    })) : [];
  };

  const getIdentities = (): {
    [key: string]: {
      handle: string;
      link: string;
    }[]
  } => order.reduce((acc, p) => {
    const platformIdentities = getPlatformHandles(p);

    if (p === 'custom' && platformIdentities.length) {
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
            link: i.url ? i.url : CrowdIntegrations.getConfig(p)?.url({
              username: i.name,
              attributes,
            }) ?? attributes?.url?.[p],
          });
        } else {
          acc[i.platform] = [{
            handle: i.name,
            link: i.url ? i.url : CrowdIntegrations.getConfig(p)?.url({
              username: i.name,
              attributes,
            }) ?? attributes?.url?.[p],
          }];
        }
      });
    } else {
      const platformHandlesValues = platformIdentities.map((i) => ({
        handle: i.name,
        link: i.url ? i.url : CrowdIntegrations.getConfig(p)?.url({
          username: i.name,
          attributes,
        }) ?? attributes?.url?.[p],
      }));

      if (platformHandlesValues.length) {
        acc[p] = platformHandlesValues;
      }
    }

    return acc;
  }, {});

  const getEmails = ():{
    handle: string;
    link: string;
  }[] => {
    const rootEmails = (emails || []).map((e) => ({
      link: `mailto:${e}`,
      handle: e,
    }));
    const usernameEmail = username.email ? username.email.map((u) => ({
      link: null,
      handle: u,
    })) : [];
    const usernameEmails = username.emails ? username.emails.map((u) => ({
      link: `mailto:${e}`,
      handle: u,
    })) : [];

    return [...rootEmails, ...usernameEmail, ...usernameEmails];
  };

  return {
    getIdentities,
    getEmails,
  };
};
