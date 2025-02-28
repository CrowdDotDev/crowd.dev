import { IdentityConfig } from '@/config/identities';
import { getImageUrlFromPath } from '@/utils/image-loader';

const confluence: IdentityConfig = {
  key: 'confluence',
  name: 'Confluence',
  image: getImageUrlFromPath('identities/confluence.svg'),
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
