import { IdentityConfig } from '@/config/identities';
import { getImageUrlFromPath } from '@/utils/image-loader';

const git: IdentityConfig = {
  key: 'git',
  name: 'Git',
  image: getImageUrlFromPath('identities/git.png'),
  member: {
    placeholder: 'Git email address',
  },
  activity: {
    showContentDetails: true,
    showSourceId: true,
    typeIcon: 'commit',
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

export default git;
