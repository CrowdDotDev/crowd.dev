import { MenuLink } from '@/modules/layout/types/MenuLink';
import config from '@/config';
import formbricks from '@/plugins/formbricks';

const shareFeedback: MenuLink = {
  id: 'share-feedback',
  label: 'Share feedback',
  icon: 'ri-feedback-line',
  display: () => config.formbricks.url && config.formbricks.environmentId,
  disable: () => false,
  click: () => formbricks.track('openFeedback'),
};

export default shareFeedback;
