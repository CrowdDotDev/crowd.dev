import { lfIdentities } from '@/config/identities';
import type { Contributor, ContributorIdentity } from '@/modules/contributor/types/Contributor';
import type { MemberIdentity } from '@/modules/member/types/Member';
import { dateHelper } from '@/shared/date-helper/date-helper';
import memberOrder from '@/shared/modules/identities/config/identitiesOrder/member';

type IdentityFields = Pick<ContributorIdentity, 'platform' | 'type' | 'value'>;
type IdentitiesInput<I> = Pick<Contributor, 'attributes'> & { identities: I[] | null };

const useContributorHelpers = () => {
  const avatar = (contributor: Pick<Contributor, 'attributes'>) =>
    contributor.attributes?.avatarUrl?.default;

  const isTeamMember = (contributor: Contributor) =>
    !!contributor.attributes?.isTeamMember?.default;

  const isBot = (contributor: Contributor) => !!contributor.attributes?.isBot?.default;

  const isNew = (contributor: Pick<Contributor, 'joinedAt'>) => {
    if (!contributor.joinedAt) {
      return false;
    }
    return dateHelper().diff(dateHelper(contributor.joinedAt), 'days') <= 14;
  };

  const identities = <I extends IdentityFields>(
    contributor: IdentitiesInput<I>,
    sort: string[] = memberOrder.list,
  ) =>
      contributor.identities
        ?.filter((i) => i.type !== 'email')
        .sort((a, b) => {
          const aIndex = sort.indexOf(a.platform);
          const bIndex = sort.indexOf(b.platform);
          const aOrder = aIndex !== -1 ? aIndex : sort.length;
          const bOrder = bIndex !== -1 ? bIndex : sort.length;
          return aOrder - bOrder;
        })
        .map((i): Omit<I, 'url'> & { url: string | null } => {
          const config = lfIdentities[i.platform];

          const link = config?.member?.url?.({
            identity: i,
            attributes: contributor.attributes,
          });
          return {
            ...i,
            url: link || null,
          };
        }) || [];

  const emails = (contributor: Contributor) => {
    const emailsdata = (contributor.identities || []).reduce(
      (obj: Record<string, any>, identity: MemberIdentity) => {
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
        emailObject[identity.value].verified =
          emailObject[identity.value].verified || identity.verified;

        return emailObject;
      },
      {},
    );
    return Object.keys(emailsdata).map((email) => ({
      value: email,
      url: `mailto:${email}`,
      ...emailsdata[email],
    }));
  };

  const activeOrganization = (contributor: Contributor) => contributor.organizations;

  return {
    avatar,
    isTeamMember,
    isBot,
    isNew,
    identities,
    emails,
    activeOrganization,
  };
};

export default useContributorHelpers;
