import { Platform } from '@/shared/modules/platform/types/Platform';
import { type Component } from 'vue';

export interface ActivityDisplayConfig {
  id: string;
  platform: Platform;
  header: Component;
  body: Component;
  conversationLinkLabel: string;
}

export type ActivityDisplayPlatformConfig = {
  [key in Platform]?: ActivityDisplayConfig
}
