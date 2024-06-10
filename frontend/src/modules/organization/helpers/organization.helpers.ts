import moment from 'moment';
import { Organization } from '@/modules/organization/types/Organization';
import organizationOrder from '@/shared/modules/identities/config/identitiesOrder/organization';

const useOrganizationHelpers = () => {
  const isNew = (organization: Organization) => {
    if (!organization.joinedAt) {
      return false;
    }
    return moment().diff(moment(organization.joinedAt), 'days')
      <= 14;
  };

  const identities = (organization: Organization, sort: string[] = organizationOrder.list) => organization.identities
    .filter((i) => !['email'].includes(i.platform))
    .sort((a, b) => {
      const aIndex = sort.indexOf(a.platform);
      const bIndex = sort.indexOf(b.platform);
      const aOrder = aIndex !== -1 ? aIndex : sort.length;
      const bOrder = bIndex !== -1 ? bIndex : sort.length;
      return aOrder - bOrder;
    });

  const domains = (organization: Organization) => [
    ...organization.emails,
    ...organization.identities
      .filter((i) => ['email'].includes(i.platform))
      .map((i) => i.name),
  ];

  const phoneNumbers = (organization: Organization) => organization.phoneNumbers || [];

  return {
    isNew,
    identities,
    domains,
    phoneNumbers,
  };
};

export default useOrganizationHelpers;
