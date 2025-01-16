import { IdentityConfig } from '@/config/identities';

const jira: IdentityConfig = {
  key: 'jira',
  name: 'Jira',
  image: '/images/identities/jira.png',
  member: {
    placeholder: 'Jira username or email address',
  },
};

export default jira;
