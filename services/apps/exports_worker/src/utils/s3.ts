import AWS from 'aws-sdk'

import { IS_DEV_ENV, getEnv } from '@crowd/common'

const awsS3Config = {
  accessKeyId: process.env['CROWD_S3_AWS_ACCESS_KEY_ID'],
  secretAccessKey: process.env['CROWD_S3_AWS_SECRET_ACCESS_KEY'],
  region: process.env['CROWD_S3_AWS_REGION'],
}

export const s3: AWS.S3 =
  getEnv() === 'local'
    ? new AWS.S3({
        s3ForcePathStyle: true,
        endpoint: `http://${process.env['CROWD_S3_HOST']}:${process.env['CROWD_S3_PORT']}`,
        apiVersion: '2012-10-17',
        ...awsS3Config,
      })
    : new AWS.S3({
        accessKeyId: process.env['CROWD_S3_AWS_ACCESS_KEY_ID'],
        secretAccessKey: process.env['CROWD_S3_AWS_SECRET_ACCESS_KEY'],
        region: process.env['CROWD_S3_AWS_REGION'],
        endpoint: process.env['CROWD_S3_ENDPOINT'],
        s3ForcePathStyle: true,
        signatureVersion: 'v4',
      })

export async function uploadToS3(key: string, body: unknown): Promise<string> {
  try {
    const bucketName = `${process.env['CROWD_S3_MICROSERVICES_ASSETS_BUCKET']}-${getEnv()}`

    await s3
      .putObject({
        Bucket: bucketName,
        Key: key,
        Body: body,
      })
      .promise()

    const endpoint = process.env['CROWD_S3_ENDPOINT']
    const region = process.env['CROWD_S3_AWS_REGION']
    let url: string

    if (IS_DEV_ENV) {
      url = `http://localhost:${process.env['CROWD_S3_PORT']}/${bucketName}/${key}`
    } else if (endpoint && endpoint.indexOf('amazonaws.com') === -1) {
      // Custom endpoint (e.g., Oracle Cloud)
      url = `${endpoint}/${bucketName}/${key}`
    } else {
      // AWS S3
      url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`
    }

    return url
  } catch (err) {
    throw new Error(err)
  }
}
