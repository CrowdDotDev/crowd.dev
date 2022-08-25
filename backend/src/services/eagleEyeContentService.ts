import moment from 'moment'
import { notLocalLambda } from './aws'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import { IServiceOptions } from './IServiceOptions'
import EagleEyeContentRepository from '../database/repositories/eagleEyeContentRepository'
import { getConfig } from '../config'
import Error400 from '../errors/Error403'
import track from '../segment/track'

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
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

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

  async bulkUpsert(data: EagleEyeSearchOutput) {
    for (const point of data) {
      await this.upsert(point)
    }
  }

  async search(args) {
    const { keywords, nDays } = args
    // We do not want what we have already accepted or rejected
    const filters = await this.findNotInbox()

    const lambdaArn =
      getConfig().NODE_ENV === 'production'
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
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      const record = await EagleEyeContentRepository.update(id, data, {
        ...this.options,
        transaction,
      })

      if (data.status) {
        track(
          `EagleEye ${data.status}`,
          {
            ...data,
            ...data,
            platform: record.platform,
            keywords: record.keywords,
            title: record.title,
            url: record.url,
          },
          { ...this.options },
        )
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
