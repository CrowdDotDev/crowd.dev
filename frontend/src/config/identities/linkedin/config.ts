import { IdentityConfig } from '@/config/identities';
import { getImageUrlFromPath } from '@/utils/image-loader';

const linkedin: IdentityConfig = {
  key: 'linkedin',
  name: 'LinkedIn',
  image: getImageUrlFromPath('identities/linkedin.png'),
  icon: 'linkedin',
  iconType: 'brands',
  color: '#2867B2',
  member: {
    urlPrefix: 'linkedin.com/in/',
    url: ({ identity }) => (!identity.value?.includes('private-')
      ? `https://linkedin.com/in/${identity.value}`
      : null),
  },
  organization: {
    urlPrefix: 'linkedin.com/company/',
  },
  activity: {
    showLink: true,
  },
  conversation: {
    replyContent: (conversation) => ({
      icon: 'reply',
      copy: 'reply',
      number: conversation.activityCount - 1,
    }),
  },
};

export default linkedin;
