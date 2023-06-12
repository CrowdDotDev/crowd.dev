import SegmentRepository from '../repositories/segmentRepository'

export async function populateSegments(options) {
  const repository = new SegmentRepository(options)
  options.currentSegments = await Promise.all(
    options.currentSegments.map(async (segment) => {
      return repository.findById(segment.id)
    }),
  )
}
