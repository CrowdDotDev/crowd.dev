import * as loom from '@loomhq/loom-embed';
import { QuickstartGuideService } from '@/modules/quickstart/services/quickstart-guide.service';

export const actions = {
  getGuides() {
    return QuickstartGuideService.fetch()
      .then((guides) => Promise.all(
        Object.entries(guides).map(([key, guide]) => {
          // if (guide.completed) {
          //   return Promise.resolve({
          //     ...guide,
          //     key,
          //   });
          // }
          try {
            return loom
              .oembed(guide.videoLink, {
                hideOwner: true,
              })
              .then((video) => ({
                ...guide,
                key,
                loomThumbnailUrl: video.thumbnail_url,
                loomHtml: video.html,
              }));
          } catch (error) {
            return Promise.resolve({
              ...guide,
              key,
            });
          }
        }),
      ))
      .then((items) => {
        this.guides = items;
        return Promise.resolve(this.guides);
      });
  },
};
