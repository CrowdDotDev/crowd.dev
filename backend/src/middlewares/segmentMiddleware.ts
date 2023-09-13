import SegmentRepository from '../database/repositories/segmentRepository'
import isFeatureEnabled from '../feature-flags/isFeatureEnabled'
import { FeatureFlag, PageData } from '../types/common'
import { SegmentData } from '../types/segmentTypes'

export async function segmentMiddleware(req, res, next) {
  try {
    let segments: PageData<SegmentData> = null
    const segmentRepository = new SegmentRepository(req)

    if (!(await isFeatureEnabled(FeatureFlag.SEGMENTS, req))) {
      // return default segment
      segments = await segmentRepository.querySubprojects({ limit: 1, offset: 0 })
    } else if (req.params.segmentId) {
      // for param requests, segments will be in the url
      segments = await segmentRepository.querySubprojects({
        filter: { ids: [req.params.segmentId] },
      })
    } else if (req.query.segments) {
      // for get requests, segments will be in query
      segments = await segmentRepository.querySubprojects({ filter: { ids: req.query.segments } })
    } else if (req.body.segments) {
      // for post and put requests, segments will be in body
      segments = await segmentRepository.querySubprojects({ filter: { ids: req.body.segments } })
    } else {
      segments = await segmentRepository.querySubprojects({ limit: 1, offset: 0 })
    }

    req.currentSegments = segments.rows.filter((s) => SegmentRepository.isSubproject(s))

    next()
  } catch (error) {
    next(error)
  }
}
