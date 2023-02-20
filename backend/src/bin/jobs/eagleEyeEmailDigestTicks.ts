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
    const users = (
      await options.database.user.findAll({
        where: {
          [Op.and]: [
            {
              'eagleEyeSettings.emailDigestActive': {
                [Op.ne]: null,
              },
            },
            {
              'eagleEyeSettings.emailDigestActive': {
                [Op.eq]: true,
              },
            },
          ],
        },
        include: [
          {
            model: options.database.tenantUser,
            as: 'tenants',
          },
        ],
      })
    ).filter(
      (u) =>
        u.eagleEyeSettings &&
        u.eagleEyeSettings.emailDigestActive &&
        moment() > moment(u.eagleEyeSettings.emailDigest.nextEmailAt),
    )

    for (const user of users) {
      await sendNodeWorkerMessage(user.id, {
        type: NodeWorkerMessageType.NODE_MICROSERVICE,
        user: user.id,
        service: 'eagle-eye-email-digest',
      } as NodeWorkerMessageBase)
    }
  },
}

export default job
