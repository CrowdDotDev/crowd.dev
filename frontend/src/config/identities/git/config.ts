import { IdentityConfig } from '@/config/identities';

const image = new URL('@/assets/images/identities/git.png', import.meta.url)
  .href;

const git: IdentityConfig = {
  key: 'git',
  name: 'Git',
  image,
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
