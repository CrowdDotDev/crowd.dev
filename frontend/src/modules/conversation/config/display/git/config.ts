import { Platform } from '@/shared/modules/platform/types/Platform';
import LfGitConversationDrawerHeaderContent from '@/modules/conversation/config/display/git/git-conversation-drawer-header-content.vue';
import LfGitConversationDrawerContent from '@/modules/conversation/config/display/git/git-conversation-drawer-content.vue';
import LfGitConversationReplies from '@/modules/conversation/config/display/git/git-conversation-replies.vue';
import LfGitConversationStarter from '@/modules/conversation/config/display/git/git-conversation-starter.vue';
import LfGitActivityLink from '@/modules/activity/config/display/git/git-activity-link.vue';
import { ConversationDisplayConfig } from '@/shared/modules/conversation/types/DisplayConfig';

const conversationDisplay: ConversationDisplayConfig = {
  id: 'gitConversation',
  platform: Platform.GIT,
  conversationDrawerHeaderContent: LfGitConversationDrawerHeaderContent,
  conversationDrawerContent: LfGitConversationDrawerContent,
  conversationTitle: 'Commit',
  conversationActivityLink: LfGitActivityLink,
  conversationStarter: LfGitConversationStarter,
  conversationReplies: LfGitConversationReplies,
};

export default conversationDisplay;
