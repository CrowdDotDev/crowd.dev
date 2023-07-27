import SegmentRepository from '../repo/segmentRepository'

export async function populateSegments(options) {
  const repository = new SegmentRepository(options)
  options.currentSegments = await Promise.all(
    options.currentSegments.map(async (segment) => repository.findById(segment.id)),
  )
}

export function switchSegments(options, segments) {
  options.currentSegments = segments
}
