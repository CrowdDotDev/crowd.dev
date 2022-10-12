import moment from 'moment'
import request from 'superagent'
import { API_CONFIG, IS_PROD_ENV, KUBE_MODE } from '../config'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import { IServiceOptions } from './IServiceOptions'
import EagleEyeContentRepository from '../database/repositories/eagleEyeContentRepository'
import Error400 from '../errors/Error403'
import track from '../segment/track'
import { notLocalLambda } from './aws'

interface EagleEyeSearchPoint {
  vectorId: string
  sourceId: string
  title: string
  text?: string
  url: string
  timestamp: number
  username: string
  similarityScore: number
  userAttributes: {
    [platform: string]: string
  }
  keywords: string[]
}

type EagleEyeSearchOutput = EagleEyeSearchPoint[]

export default class EagleEyeContentService {
  options: IServiceOptions

  constructor(options) {
    this.options = options
  }

  async upsert(data) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const record = await EagleEyeContentRepository.upsert(data, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'EagleEyeContent')

      throw error
    }
  }

  async findNotInbox() {
    const shown = (
      await EagleEyeContentRepository.findAndCountAll(
        {
          filter: {
            timestampRange: [
              moment().subtract(30, 'days').toDate(),
              moment().add(1, 'hour').toDate(),
            ],
            status: 'NOT_NULL',
          },
        },
        this.options,
      )
    ).rows
    // Slicing results such that lambda payload will not be too big
    return shown.map((record) => record.vectorId).slice(0, 20000)
  }

  async findAndCountAll(args) {
    return EagleEyeContentRepository.findAndCountAll(args, this.options)
  }

  async query(data) {
    const advancedFilter = data.filter
    const orderBy = data.orderBy
    const limit = data.limit
    const offset = data.offset
    return EagleEyeContentRepository.findAndCountAll(
      { advancedFilter, orderBy, limit, offset },
      this.options,
    )
  }

  async bulkUpsert(data: EagleEyeSearchOutput) {
    for (const point of data) {
      await this.upsert(point)
    }
  }

  async search(args) {
    const { keywords, nDays } = args
    // We do not want what we have already accepted or rejected
    const filters = await this.findNotInbox()

    // TODO-kube
    if (KUBE_MODE) {
      try {
        const response = await request
          .post(`${API_CONFIG.premiumApiUrl}/search`)
          .send({ queries: keywords, nDays, filters })

        const fromEagleEye: EagleEyeSearchOutput = JSON.parse(response.text)
        await this.bulkUpsert(fromEagleEye)
        return fromEagleEye
      } catch (error) {
        console.log('error while calling eagle eye server!', error)
        throw new Error400('en', 'errors.wrongEagleEyeSearch.message')
      }
    }

    // TODO-kube
    const lambdaArn = IS_PROD_ENV
      ? 'arn:aws:lambda:eu-central-1:359905442998:function:EagleEye-prod-search'
      : 'arn:aws:lambda:eu-central-1:359905442998:function:EagleEye-staging-search'
    const params = {
      FunctionName: lambdaArn,
      Payload: JSON.stringify({ queries: keywords, ndays: nDays, filters }),
    }
    try {
      // Call Eagle Eye lambda function
      let fromEagleEye: EagleEyeSearchOutput = JSON.parse(
        (await notLocalLambda.invoke(params).promise()).Payload,
      )
      if (typeof fromEagleEye === 'string') {
        fromEagleEye = JSON.parse(fromEagleEye)
      }
      console.log('FromEagleEye')
      console.log(fromEagleEye)
      await this.bulkUpsert(fromEagleEye)

      return {
        status: 'success',
      }
    } catch (error) {
      console.log('error', error)
      throw new Error400('en', 'errors.wrongEagleEyeSearch.message')
    }
  }

  async update(id, data) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const recordBeforeUpdate = await EagleEyeContentRepository.findById(id, { ...this.options })
      const record = await EagleEyeContentRepository.update(id, data, {
        ...this.options,
        transaction,
      })

      // If we are updating status we want to track it
      if (data.status !== recordBeforeUpdate.status) {
        // If we are going from null to status, we are either accepting or rejecting
        if (data.status && data.status !== null && data.status !== undefined) {
          track(
            `EagleEye ${data.status}`,
            {
              ...data,
              platform: record.platform,
              keywords: record.keywords,
              title: record.title,
              url: record.url,
            },
            { ...this.options },
          )
          // Here we are bringing back a rejected post to the Inbox
        } else if (recordBeforeUpdate.status === 'rejected' && data.status === null) {
          track(
            `EagleEye post from rejected to Inbox`,
            {
              ...data,
              platform: record.platform,
              keywords: record.keywords,
              title: record.title,
              url: record.url,
            },
            { ...this.options },
          )
        }
      }

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'EagleEyeContent')

      throw error
    }
  }

  async findById(id) {
    return EagleEyeContentRepository.findById(id, this.options)
  }
}
