import { Op } from 'sequelize'
import moment from 'moment'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { CrowdJob } from '../../types/jobTypes'
import { getNodejsWorkerEmitter } from '@/serverless/utils/serviceSQS'

const job: CrowdJob = {
  name: 'Eagle Eye Email Digest Ticker',
  // every half hour
  cronTime: '*/30 * * * *',
  onTrigger: async () => {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()
    const tenantUsers = (
      await options.database.tenantUser.findAll({
        where: {
          [Op.and]: [
            {
              'settings.eagleEye.emailDigestActive': {
                [Op.ne]: null,
              },
            },
            {
              'settings.eagleEye.emailDigestActive': {
                [Op.eq]: true,
              },
            },
          ],
        },
      })
    ).filter(
      (tenantUser) =>
        tenantUser.settings.eagleEye &&
        tenantUser.settings.eagleEye.emailDigestActive &&
        moment() > moment(tenantUser.settings.eagleEye.emailDigest.nextEmailAt),
    )

    const emitter = await getNodejsWorkerEmitter()

    for (const tenantUser of tenantUsers) {
      await emitter.eagleEyeEmailDigest(tenantUser.tenantId, tenantUser.userId)
    }
  },
}

export default job
