import type { RouteLocationRaw } from 'vue-router';

export interface TimelineGroup {
  label: string;
  labelLink?: RouteLocationRaw;
  icon?: string;
  items: any[];
}
