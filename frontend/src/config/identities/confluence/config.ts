import { IdentityConfig } from '@/config/identities';

const image = new URL(
  '@/assets/images/identities/confluence.svg',
  import.meta.url,
).href;

const confluence: IdentityConfig = {
  key: 'confluence',
  name: 'Confluence',
  image,
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
