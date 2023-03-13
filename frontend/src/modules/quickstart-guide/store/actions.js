import { QuickstartGuideService } from '@/modules/quickstart-guide/services/quickstart-guide.service'
import * as loom from '@loomhq/loom-embed'

export default {
  getGuides() {
    return QuickstartGuideService.fetch()
      .then((guides) => {
        return Promise.all(
          Object.entries(guides).map(([key, guide]) => {
            if (guide.completed) {
              return Promise.resolve({
                ...guide,
                key
              })
            }
            try {
              return loom
                .oembed(guide.videoLink, {
                  hideOwner: true
                })
                .then((video) => ({
                  ...guide,
                  key,
                  loomThumbnailUrl: video.thumbnail_url,
                  loomHtml: video.html
                }))
            } catch (error) {
              return Promise.resolve({
                ...guide,
                key
              })
            }
          })
        )
      })
      .then((items) => {
        this.guides = items
        return Promise.resolve(this.guides)
      })
  }
}
