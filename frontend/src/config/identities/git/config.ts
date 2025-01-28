import { IdentityConfig } from '@/config/identities';

const git: IdentityConfig = {
  key: 'git',
  name: 'Git',
  image: '/images/identities/git.png',
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
