import { FeatureFlag, SegmentData } from '@crowd/types'
import SegmentRepository from '../database/repositories/segmentRepository'
import isFeatureEnabled from '../feature-flags/isFeatureEnabled'

export async function segmentMiddleware(req, res, next) {
  try {
    let segments: any = null
    const segmentRepository = new SegmentRepository(req)

    if (!(await isFeatureEnabled(FeatureFlag.SEGMENTS, req))) {
      // return default segment
      segments = await segmentRepository.querySubprojects({ limit: 1, offset: 0 })
    } else if (req.params.segmentId) {
      // for param requests, segments will be in the url
      segments = { rows: await segmentRepository.findInIds([req.params.segmentId]) }
    } else if (req.query.segments) {
      // for get requests, segments will be in query
      segments = { rows: await segmentRepository.findInIds(req.query.segments) }
    } else if (req.body.segments) {
      // for post and put requests, segments will be in body
      segments = { rows: await segmentRepository.findInIds(req.body.segments) }
    } else {
      segments = await segmentRepository.querySubprojects({ limit: 1, offset: 0 })
    }

    req.currentSegments = segments.rows.filter((s) => SegmentRepository.isSubproject(s))

    next()
  } catch (error) {
    next(error)
  }
}
