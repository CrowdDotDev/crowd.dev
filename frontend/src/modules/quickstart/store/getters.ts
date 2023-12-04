import { QuickstartState } from '@/modules/quickstart/store/state';

export const getters = {
  notcompletedGuides: (state: QuickstartState) => state.guides.filter((guide) => !guide.completed),
};
