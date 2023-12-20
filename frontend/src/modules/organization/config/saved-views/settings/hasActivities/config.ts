import { SavedViewsSetting } from '@/shared/modules/saved-views/types/SavedViewsConfig';

const hasActivities: SavedViewsSetting<boolean> = {
  inSettings: false,
  defaultValue: true,
  queryUrlParser(value: string): boolean {
    return value === 'true';
  },
  apiFilterRenderer(): any[] {
    return [
      { activityCount: { gt: 0 } },
    ];
  },
};

export default hasActivities;
