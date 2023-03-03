import { Op } from 'sequelize'
import moment from 'moment'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { CrowdJob } from '../../types/jobTypes'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'

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

    for (const tenantUser of tenantUsers) {
      await sendNodeWorkerMessage(tenantUser.tenantId, {
        type: NodeWorkerMessageType.NODE_MICROSERVICE,
        user: tenantUser.userId,
        tenant: tenantUser.tenantId,
        service: 'eagle-eye-email-digest',
      } as NodeWorkerMessageBase)
    }
  },
}

export default job
