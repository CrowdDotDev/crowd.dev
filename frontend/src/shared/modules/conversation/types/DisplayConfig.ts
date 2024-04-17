import { Platform } from '@/shared/modules/platform/types/Platform';
import { type Component } from 'vue';

export interface ConversationDisplayConfig {
  id: string;
  platform: Platform;
  conversationDrawerHeaderContent: Component;
  conversationDrawerContent: Component;
  conversationTitle: string;
  conversationActivityLink?: Component;
  conversationStarter: Component;
  conversationReplies: Component;
}

export type ConversationDisplayPlatformConfig = {
  [key in Platform]?: ConversationDisplayConfig
}
