import { Platform } from '@/shared/modules/platform/types/Platform';
import { type Component } from 'vue';

export interface ActivityDisplayConfig {
  id: string;
  platform: Platform;
  activityHeaderContent: Component;
  activityContent: Component;
  conversationHeaderContent: Component;
  conversationContent: Component;
  conversationTitle: string;
  conversationActivityLink?: Component;
}

export type ActivityDisplayPlatformConfig = {
  [key in Platform]?: ActivityDisplayConfig
}
