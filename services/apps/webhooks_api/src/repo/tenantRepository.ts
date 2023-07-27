import SequelizeRepository from './sequelizeRepository'
import { IRepositoryOptions } from './IRepositoryOptions'
import SegmentRepository from './segmentRepository'
import { FeatureFlag } from '../types/common'
import isFeatureEnabled from '@/feature-flags/isFeatureEnabled'

class TenantRepository {
  static async findById(id, options: IRepositoryOptions, segments: string[] = []) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = ['settings', 'conversationSettings']

    const record = await options.database.tenant.findByPk(id, {
      include,
      transaction,
    })

    const segmentRepository = new SegmentRepository({ ...options, currentTenant: record })
    let segmentsFound

    if (!(await isFeatureEnabled(FeatureFlag.SEGMENTS, { ...options, currentTenant: record }))) {
      // return default segment
      const defaultSegment = await segmentRepository.getDefaultSegment()
      segmentsFound = defaultSegment ? [defaultSegment] : []
    } else if (segments.length > 0) {
      segmentsFound = await segmentRepository.findInIds(segments)
    } else {
      // no segment info sent, return all segments
      segmentsFound = (await segmentRepository.querySubprojects({})).rows
    }

    if (
      record &&
      record.settings &&
      record.settings[0] &&
      record.settings[0].dataValues &&
      segmentsFound.length > 0
    ) {
      record.settings[0].dataValues.activityTypes = SegmentRepository.getActivityTypes({
        ...options,
        currentTenant: record,
        currentSegments: segmentsFound,
      })
      record.settings[0].dataValues.slackWebHook = !!record.settings[0].dataValues.slackWebHook
    }

    return record
  }
}

export default TenantRepository
