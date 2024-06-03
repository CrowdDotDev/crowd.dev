import { Contributor } from '@/modules/contributor/types/Contributor';
import moment from 'moment';
import { computed } from 'vue';
import { MemberIdentity } from '@/modules/member/types/Member';
import { CrowdIntegrations } from '@/integrations/integrations-config';

const useContributorHelpers = () => {
  const avatar = (contributor: Contributor) => contributor.attributes?.avatarUrl?.default;

  const isTeamContributor = (contributor: Contributor) => !!contributor.attributes?.isTeamMember?.default;

  const isBot = (contributor: Contributor) => !!contributor.attributes.isBot?.default;

  const isNew = (contributor: Contributor) => {
    if (!contributor.joinedAt) {
      return false;
    }
    return moment().diff(moment(contributor.joinedAt), 'days')
      <= 14;
  };

  const identities = (contributor: Contributor) => contributor.identities?.filter((i) => i.type !== 'email')
    .map((i) => {
      const config = CrowdIntegrations.getConfig(i.platform);

      const link = config?.url({
        username: i.value,
        attributes: contributor.attributes,
      });
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
      ...emailsdata[email],
    }));
  };

  return {
    avatar,
    isTeamContributor,
    isBot,
    isNew,
    identities,
    emails,
  };
};

export default useContributorHelpers;
