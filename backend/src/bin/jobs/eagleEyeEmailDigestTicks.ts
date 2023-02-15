import { Op } from 'sequelize'
import moment from 'moment'
import cronGenerator from 'cron-time-generator'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { IntegrationProcessor } from '../../serverless/integrations/services/integrationProcessor'
import { IServiceOptions } from '../../services/IServiceOptions'
import { CrowdJob } from '../../types/jobTypes'
import { getServiceLogger } from '../../utils/logging'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'



const job: CrowdJob = {
    name: 'Integration Ticker',
    // every two hours
    cronTime: cronGenerator.every(20).minutes(),
    onTrigger: async () => {

        const options = await SequelizeRepository.getDefaultIRepositoryOptions();
        const users = (await options.database.user.findAll({
            where: {
                [Op.and]: [
                    {
                        'eagleEyeSettings.emailDigestActive': {
                            [Op.ne]: null
                        }
                    },
                    {
                        'eagleEyeSettings.emailDigestActive': {
                            [Op.eq]: true
                        }
                    }
                ]

            },
            include: [
                {
                    model: options.database.tenantUser,
                    as: 'tenants',
                },
            ],
        }))
        .filter( (u) => u.eagleEyeSettings && u.eagleEyeSettings.emailDigestActive && moment() > moment(u.eagleEyeSettings.emailDigest.nextEmailAt))
    
        for (const user of users ){
            await sendNodeWorkerMessage(user.id, {
                type: NodeWorkerMessageType.NODE_MICROSERVICE,
                user: user.id,
                service: 'eagle-eye-email-digest',
              } as NodeWorkerMessageBase)
        }

    }
}

setImmediate(async () => {
    console.log("Trying stuff out..")
    await job.onTrigger()

})

export default job


