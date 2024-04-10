import { Platform } from '@/shared/modules/platform/types/Platform';
import { ActivityDisplayConfig } from '@/shared/modules/activity/types/DisplayConfig';
import LfGitActivityHeaderContent from './git-activity-header-content.vue';
import LfGitActivityContent from './git-activity-content.vue';
import LfGitConversationHeaderContent from './git-conversation-header-content.vue';
import LfGitConversationContent from './git-conversation-content.vue';
import LfGitActivityLink from './git-activity-link.vue';

const activityDisplay: ActivityDisplayConfig = {
  id: 'gitActivity',
  platform: Platform.GIT,
  activityHeaderContent: LfGitActivityHeaderContent,
  activityContent: LfGitActivityContent,
  conversationHeaderContent: LfGitConversationHeaderContent,
  conversationContent: LfGitConversationContent,
  conversationTitle: 'Commit',
  conversationActivityLink: LfGitActivityLink,
};

export default activityDisplay;
