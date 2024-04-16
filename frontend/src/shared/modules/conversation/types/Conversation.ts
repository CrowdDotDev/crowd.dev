import { Platform } from '../../platform/types/Platform';
import { Activity } from '../../activity/types/Activity';

export interface Conversation {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  segmentId: string;
  createdById: string;
  updatedById: string;
  activities: Activity[];
  memberCount: number;
  conversationStarter: Activity;
  activityCount: number;
  platform: Platform;
  channel: string;
  lastActive: string;
  lastReplies: Activity[];
}
