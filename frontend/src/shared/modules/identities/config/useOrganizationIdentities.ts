import { CrowdIntegrations } from '@/integrations/integrations-config';
import {
  Organization,
  OrganizationIdentity,
  OrganizationIdentityType,
} from '@/modules/organization/types/Organization';
import { Platform } from '@/shared/modules/platform/types/Platform';

export default ({
  organization,
  order,
}: {
  organization: Partial<Organization>;
  order: Platform[];
}) => {
  const { identities = [], phoneNumbers = [] } = organization || {};

  const getIdentityHandles = (platform: string) => {
    if (platform === Platform.CUSTOM) {
      const mainPlatforms = (Object.values(Platform) as string[]).filter(
        (p) => p !== Platform.CUSTOM,
      );

      return (identities || []).filter(
        (i) => !mainPlatforms.includes(i.platform)
          && [OrganizationIdentityType.USERNAME].includes(i.type),
      );
    }

    return (identities || []).filter(
      (i) => i.platform === platform
        && [OrganizationIdentityType.USERNAME].includes(i.type),
    );
  };

  const getIdentityLink = (
    identity: OrganizationIdentity,
    platform: string,
  ) => {
    if (!CrowdIntegrations.getConfig(platform)?.usernameLink) {
      return null;
    }

    return CrowdIntegrations.getConfig(platform)?.usernameLink({
      username: identity.value,
    });
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
          return a.value.localeCompare(b.value);
        }

        return platformComparison; // Otherwise, sort by platform
      });

      sortedCustomIdentities.forEach((identity) => {
        if (acc[identity.platform]?.length) {
          acc[identity.platform].push({
            handle: identity.value,
            link: getIdentityLink(identity, platform),
            verified: identity.verified,
          });
        } else {
          acc[identity.platform] = [
            {
              handle: identity.value,
              link: getIdentityLink(identity, platform),
              verified: identity.verified,
            },
          ];
        }
      });
    } else {
      const platformHandlesValues = handles.map((identity) => ({
        handle: identity.value,
        link: getIdentityLink(identity, platform),
        verified: identity.verified,
      }));

      if (platformHandlesValues.length) {
        acc[platform] = platformHandlesValues;
      }
    }

    return acc;
  }, {} as Record<Platform, { handle: string; link: string; verified: boolean }[]>);

  const getEmails = (): {
    handle: string;
    link: string | null;
  }[] => {
    const parsedIdentities = identities?.length ? identities : [];

    const identitiesEmails = parsedIdentities
      .filter((identity) => [
        OrganizationIdentityType.PRIMARY_DOMAIN,
        OrganizationIdentityType.ALTERNATIVE_DOMAIN,
        OrganizationIdentityType.AFFILIATED_PROFILE,
      ].includes(identity.type))
      .map((identity) => ({
        link: null,
        handle: identity.value,
      }));

    return identitiesEmails;
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
