import { getServiceChildLogger } from '@crowd/logging'
import cronGenerator from 'cron-time-generator'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { CrowdJob } from '../../types/jobTypes'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import moment from 'moment'
import { decryptData } from '../../utils/crypto'

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
      tokenExpiry: string
      updateMemberAttributes: boolean
    }

    const expiredGroupsIOTokens = await dbOptions.database.sequelize.query(
      `select id, settings from integrations 
                where  platform = 'groupsio' 
                and DATE_PART('day', to_date( settings ->> 'tokenExpiry', 'YYYY-MM-DD') - now() ) < 2`,
    )

    for (const integration of expiredGroupsIOTokens[0]) {
      //update groups io token
      let thisSetting: SetttingsObj = integration.settings
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

      let response: AxiosResponse
      try {
        response = await axios(config)

        // we need to get cookie from the response  and it's expiry
        const cookie = response.headers['set-cookie'][0].split(';')[0]
        let cookieExpiryString: string = response.headers['set-cookie'][0]
          .split(';')[3]
          .split('=')[1]
        const cookieExpiry = moment(cookieExpiryString).format('YYYY-MM-DD HH:mm:ss.sss Z')

        thisSetting.token = cookie
        thisSetting.tokenExpiry = cookieExpiry
      } catch (err) {
        if ('two_factor_required' in response.data) {
          throw new Error('errors.groupsio.twoFactorRequired')
        }
        throw new Error('errors.groupsio.invalidCredentials')
      }

      await dbOptions.database.integration.update(
        { settings: thisSetting },
        { where: { id: integration.id } },
      )
    }
  },
}

export default job
