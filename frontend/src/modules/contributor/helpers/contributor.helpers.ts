import moment from 'moment';
import { MemberIdentity } from '@/modules/member/types/Member';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import memberOrder from '@/shared/modules/identities/config/identitiesOrder/member';
import { Contributor } from '@/modules/contributor/types/Contributor';

const useContributorHelpers = () => {
  const avatar = (contributor: Contributor) => contributor.attributes?.avatarUrl?.default;

  const isTeamMember = (contributor: Contributor) => !!contributor.attributes?.isTeamMember?.default;

  const isBot = (contributor: Contributor) => !!contributor.attributes?.isBot?.default;

  const isMasked = (contributor: Contributor) => !!contributor.attributes?.gdprDeleteRequest?.default;

  const isNew = (contributor: Contributor) => {
    if (!contributor.joinedAt) {
      return false;
    }
    return moment().diff(moment(contributor.joinedAt), 'days')
      <= 14;
  };

  const identities = (contributor: Contributor, sort: string[] = memberOrder.list) => contributor.identities
    ?.filter((i) => i.type !== 'email')
    .sort((a, b) => {
      const aIndex = sort.indexOf(a.platform);
      const bIndex = sort.indexOf(b.platform);
      const aOrder = aIndex !== -1 ? aIndex : sort.length;
      const bOrder = bIndex !== -1 ? bIndex : sort.length;
      return aOrder - bOrder;
    })
    .map((i) => {
      const config = CrowdIntegrations.getConfig(i.platform);

      const link = config?.url ? config?.url({
        username: i.value,
        attributes: contributor.attributes,
      }) : null;
      return {
        ...i,
        url: config?.showProfileLink ? link : null,
      };
    }) || [];

  const emails = (contributor: Contributor) => {
    const emailsdata = (contributor.identities || [])
      .reduce((obj: Record<string, any>, identity: MemberIdentity) => {
        if (identity.type !== 'email') {
          return obj;
        }
        const emailObject = { ...obj };
        if (!(identity.value in emailObject)) {
          emailObject[identity.value] = {
            ...identity,
            platforms: [],
          };
        }
        emailObject[identity.value].platforms.push(identity.platform);
        emailObject[identity.value].verified = emailObject[identity.value].verified || identity.verified;

        return emailObject;
      }, {});
    return Object.keys(emailsdata).map((email) => ({
      value: email,
      url: `mailto:${email}`,
      ...emailsdata[email],
    }));
  };

  const activeOrganization = (contributor: Contributor) => contributor.organizations?.[0];

  return {
    avatar,
    isTeamMember,
    isBot,
    isMasked,
    isNew,
    identities,
    emails,
    activeOrganization,
  };
};

export default useContributorHelpers;
