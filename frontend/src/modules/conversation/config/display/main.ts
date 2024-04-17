import { Platform } from '@/shared/modules/platform/types/Platform';
import { ConversationDisplayPlatformConfig } from '@/shared/modules/conversation/types/DisplayConfig';
import gitDisplay from './git/config';

const config: ConversationDisplayPlatformConfig = {
  [Platform.GIT]: gitDisplay,
};

export default config;
