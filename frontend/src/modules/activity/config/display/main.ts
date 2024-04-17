import { Platform } from '@/shared/modules/platform/types/Platform';
import { ActivityDisplayPlatformConfig } from '@/shared/modules/activity/types/DisplayConfig';
import gitDisplay from './git/config';

const config: ActivityDisplayPlatformConfig = {
  [Platform.GIT]: gitDisplay,
};

export default config;
