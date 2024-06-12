import moment from 'moment';
import { Organization, OrganizationIdentityType } from '@/modules/organization/types/Organization';
import organizationOrder from '@/shared/modules/identities/config/identitiesOrder/organization';
import { CrowdIntegrations } from '@/integrations/integrations-config';

const useOrganizationHelpers = () => {
  const isNew = (organization: Organization) => {
    if (!organization.joinedAt) {
      return false;
    }
    return moment().diff(moment(organization.joinedAt), 'days')
      <= 14;
  };

  const identities = (organization: Organization, sort: string[] = organizationOrder.list) => organization.identities
    .filter((i) => OrganizationIdentityType.USERNAME === i.type)
    .sort((a, b) => {
      const aIndex = sort.indexOf(a.platform);
      const bIndex = sort.indexOf(b.platform);
      const aOrder = aIndex !== -1 ? aIndex : sort.length;
      const bOrder = bIndex !== -1 ? bIndex : sort.length;
      return aOrder - bOrder;
    })
    .map((i) => ({
      ...i,
      url: CrowdIntegrations.getConfig(i.platform)?.organization?.identityLink?.({
        identityHandle: i.value,
      }) || '',
    }));

  const emails = (organization: Organization) => (organization.emails || []);

  const primaryDomains = (organization: Organization) => organization.identities
    .filter((i) => OrganizationIdentityType.PRIMARY_DOMAIN === i.type);

  const alternativeDomains = (organization: Organization) => organization.identities
    .filter((i) => OrganizationIdentityType.ALTERNATIVE_DOMAIN === i.type);

  const domains = (organization: Organization) => organization.identities
    .filter((i) => [
      OrganizationIdentityType.PRIMARY_DOMAIN,
      OrganizationIdentityType.ALTERNATIVE_DOMAIN,
      OrganizationIdentityType.AFFILIATED_PROFILE,
    ].includes(i.type));

  const website = (organization: Organization) => primaryDomains(organization)?.[0];

  const affiliatedProfiles = (organization: Organization) => organization.identities
    .filter((i) => OrganizationIdentityType.EMAIL === i.type);

  const phoneNumbers = (organization: Organization) => organization.phoneNumbers || [];

  return {
    isNew,
    identities,
    emails,
    primaryDomains,
    alternativeDomains,
    website,
    domains,
    affiliatedProfiles,
    phoneNumbers,
  };
};

export default useOrganizationHelpers;
