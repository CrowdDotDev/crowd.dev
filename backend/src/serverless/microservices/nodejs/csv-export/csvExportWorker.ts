import moment from 'moment'
import { parseAsync } from 'json2csv'
import { HttpRequest } from '@aws-sdk/protocol-http'
import { S3RequestPresigner } from '@aws-sdk/s3-request-presigner'
import { Hash } from '@aws-sdk/hash-node'
import { parseUrl } from '@aws-sdk/url-parser'
import { formatUrl } from '@aws-sdk/util-format-url'
import { getServiceChildLogger } from '@crowd/logging'
import { ExportableEntity } from '@crowd/types'
import getUserContext from '../../../../database/utils/getUserContext'
import EmailSender from '../../../../services/emailSender'
import { S3_CONFIG } from '../../../../conf'
import { BaseOutput } from '../messageTypes'
import getStage from '../../../../services/helpers/getStage'
import { s3 } from '../../../../services/aws'
import MemberService from '../../../../services/memberService'
import UserRepository from '../../../../database/repositories/userRepository'

const log = getServiceChildLogger('csvExportWorker')

/**
 * Sends weekly analytics emails of a given tenant
 * to all users of the tenant.
 * Data sent is for the last week.
 * @param tenantId
 */
async function csvExportWorker(
  entity: ExportableEntity,
  userId: string,
  tenantId: string,
  segmentIds: string[],
  criteria: any,
): Promise<BaseOutput> {
  const fields = [
    'id',
    'username',
    'displayName',
    'emails',
    'score',
    'joinedAt',
    'activeOn',
    'identities',
    'tags',
    'notes',
    'organizations',
    'activityCount',
    'lastActive',
    'reach',
    'averageSentiment',
    'score',
    'attributes',
  ]

  const opts = { fields }

  // get the data without limits
  const userContext = await getUserContext(tenantId, null, segmentIds)

  let data = null

  switch (entity) {
    case ExportableEntity.MEMBERS: {
      const memberService = new MemberService(userContext)
      data = await memberService.queryForCsv(criteria)
      break
    }
    default:
      throw new Error(`Unrecognized exportable entity ${entity}`)
  }

  if (!data || !data.rows) {
    const message = `Unable to retrieve data to export as CSV, exiting..`
    log.error(message)
    return {
      status: 400,
      msg: message,
    }
  }

  const csv = await parseAsync(data.rows, opts)

  const key = `csv-exports/${moment().format('YYYY-MM-DD')}_${entity}_${tenantId}.csv`

  log.info({ tenantId, entity }, `Uploading csv to s3..`)
  const privateObjectUrl = await uploadToS3(csv, key)
  log.info({ tenantId, entity }, 'CSV uploaded successfully.')

  log.info({ tenantId, entity }, `Generating pre-signed url..`)
  const url = await getPresignedUrl(privateObjectUrl)
  log.info({ tenantId, entity, url }, `Url generated successfully.`)

  log.info({ tenantId, entity }, `Sending e-mail with pre-signed url..`)
  const user = await UserRepository.findById(userId, userContext)

  await new EmailSender(EmailSender.TEMPLATES.CSV_EXPORT, { link: url }).sendTo(user.email)

  log.info({ tenantId, entity, email: user.email }, `CSV export e-mail with download link sent.`)

  return {
    status: 200,
    msg: `CSV export e-mail sent!`,
  }
}

async function uploadToS3(csv: any, key: string): Promise<string> {
  try {
    await s3
      .putObject({
        Bucket: `${S3_CONFIG.microservicesAssetsBucket}-${getStage()}`,
        Key: key,
        Body: csv,
      })
      .promise()

    return `https://${S3_CONFIG.microservicesAssetsBucket}-${getStage()}.s3.${
      S3_CONFIG.aws.region
    }.amazonaws.com/${key}`
  } catch (error) {
    log.error(error, 'Error on uploading CSV file!')
    throw error
  }
}

async function getPresignedUrl(objectUrl: string): Promise<string> {
  try {
    const awsS3ObjectUrl = parseUrl(objectUrl)

    const presigner = new S3RequestPresigner({
      credentials: {
        accessKeyId: S3_CONFIG.aws.accessKeyId,
        secretAccessKey: S3_CONFIG.aws.secretAccessKey,
      },
      region: S3_CONFIG.aws.region,
      sha256: Hash.bind(null, 'sha256'),
    })

    const url = formatUrl(await presigner.presign(new HttpRequest(awsS3ObjectUrl)))
    return url
  } catch (error) {
    log.error(error, 'Error on creating pre-signed url!')
    throw error
  }
}

export { csvExportWorker }
