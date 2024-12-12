import type { RouteLocationRaw } from 'vue-router';

export interface TimelineGroup {
  id: number;
  label: string;
  labelLink?: RouteLocationRaw;
  icon?: string;
  items: any[];
}
