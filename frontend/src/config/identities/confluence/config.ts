import { IdentityConfig } from '@/config/identities';

const confluence: IdentityConfig = {
  key: 'confluence',
  name: 'Confluence',
  image: '/src/assets/images/identities/confluence.svg',
  member: {
    placeholder: 'Confluence username or email address',
  },
  activity: {
    showLink: true,
    showSourceId: true,
  },
  conversation: {
    attributes: (attributes) => ({
      changes: attributes.lines,
      changesCopy: 'line',
      insertions: attributes.insertions,
      deletions: attributes.deletions,
    }),
  },
};

export default confluence;
