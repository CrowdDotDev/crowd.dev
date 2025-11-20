import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import cronGenerator from 'cron-time-generator'
import moment from 'moment'

import { decryptData } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'

import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { CrowdJob } from '../../types/jobTypes'

const log = getServiceChildLogger('refreshgroupsioTokenCronJob')

const job: CrowdJob = {
  name: 'Refresh Groups IO token',
  // every day
  cronTime: cronGenerator.every(1).days(),
  onTrigger: async () => {
    log.info('Checking expiry for current groups io token.')
    const dbOptions = await SequelizeRepository.getDefaultIRepositoryOptions()

    interface SetttingsObj {
      email: string
      token: string
      groups: string[]
      password: string
      tokenError: string
      tokenExpiry: string
      updateMemberAttributes: boolean
    }

    const expiredGroupsIOTokens = await dbOptions.database.sequelize.query(
      `select id, settings from integrations 
                where  platform = 'groupsio' 
                and "deletedAt" is null        
                and DATE_PART('day', to_date( settings ->> 'tokenExpiry', 'YYYY-MM-DD') - now() ) < 2`,
    )

    for (const integration of expiredGroupsIOTokens[0]) {
      const thisSetting: SetttingsObj = integration.settings
      thisSetting.tokenError = ''

      log.info('Refreshing token for groups: ', thisSetting.groups)

      try {
        const decryptedPassword = decryptData(thisSetting.password)

        const config: AxiosRequestConfig = {
          method: 'post',
          url: 'https://groups.io/api/v1/login',
          params: {
            email: thisSetting.email,
            password: decryptedPassword,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }

        const response: AxiosResponse = await axios(config)

        // we need to get cookie from the response  and it's expiry
        const cookie = response.headers['set-cookie'][0].split(';')[0]
        const cookieExpiryString: string = response.headers['set-cookie'][0]
          .split(';')[3]
          .split('=')[1]
        const cookieExpiry = moment(cookieExpiryString).format('YYYY-MM-DD HH:mm:ss.sss Z')

        thisSetting.token = cookie
        thisSetting.tokenExpiry = cookieExpiry
      } catch (err) {
        thisSetting.tokenError = err.message
        log.error(err.message)
      } finally {
        await dbOptions.database.integration.update(
          { settings: thisSetting },
          { where: { id: integration.id } },
        )
      }
    }
  },
}

export default job
