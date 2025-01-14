import { IdentityConfig } from '@/config/identities';

const slack: IdentityConfig = {
  key: 'slack',
  name: 'Slack',
  image: '/images/identities/slack.png',
  member: {
    placeholder: 'Slack username or email address',
    url: ({ identity }) => (identity.value ? `https://slack.com/${identity.value}` : null),
  },
};

export default slack;
