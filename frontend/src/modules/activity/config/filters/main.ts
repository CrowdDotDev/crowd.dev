import { FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import activityType from './activityType/config';
import channel from './channel/config';
import date from './date/config';
import member from './member/config';
import platform from './platform/config';
import sentiment from './sentiment/config';

export const activityFilters: Record<string, FilterConfig> = {
  activityType,
  channel,
  date,
  member,
  platform,
  sentiment,
};
