import { Platform } from '@/shared/modules/platform/types/Platform';
import { ActivityDisplayConfig } from '@/shared/modules/activity/types/DisplayConfig';
import ActivityHeader from './activityHeader.vue';
import ActivityBody from './activityBody.vue';

const activityDisplay: ActivityDisplayConfig = {
  id: 'gitActivity',
  platform: Platform.GIT,
  header: ActivityHeader,
  body: ActivityBody,
  conversationLinkLabel: 'Open commit',
};

export default activityDisplay;
