import { QuickstartGuide } from '@/modules/quickstart/types/QuickstartGuide';

export interface QuickstartState {
  guides: QuickstartGuide[];
}

export const state = (): QuickstartState => ({
  guides: [],
});
