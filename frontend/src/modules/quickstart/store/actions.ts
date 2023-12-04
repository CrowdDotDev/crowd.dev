import { QuickstartGuideService } from '@/modules/quickstart/services/quickstart-guide.service';
import { QuickstartGuide } from '@/modules/quickstart/types/QuickstartGuide';

export const actions = {
  getGuides(): Promise<QuickstartGuide[]> {
    return QuickstartGuideService.fetch()
      .then((guideObject: Record<string, QuickstartGuide>) => {
        this.guides = Object.entries(guideObject).map(([key, guide]) => ({
          ...guide,
          key,
        }));
        return Promise.resolve(this.guides);
      });
  },
};
