import { getEnv } from '@crowd/common'
import AWS from 'aws-sdk'

export let s3: AWS.S3

if (process.env['KUBE_MODE']) {
  const awsS3Config = {
    accessKeyId: process.env['CROWD_S3_AWS_ACCESS_KEY_ID'],
    secretAccessKey: process.env['CROWD_S3_AWS_SECRET_ACCESS_KEY'],
    region: process.env['CROWD_S3_AWS_REGION'],
  }

  s3 =
    getEnv() === 'local'
      ? new AWS.S3({
          s3ForcePathStyle: true,
          endpoint: `http://${process.env['CROWD_S3_HOST']}:${process.env['CROWD_S3_PORT']}`,
          apiVersion: '2012-10-17',
          ...awsS3Config,
        })
      : new AWS.S3({ apiVersion: '2012-10-17', ...awsS3Config })
} else {
  if (process.env['SERVICE'] === 'default') {
    AWS.config.update({
      accessKeyId: process.env['AWS_ACCESS_KEY_ID'],
      secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'],
      region: 'eu-central-1',
    })
  }

  s3 =
    getEnv() === 'local'
      ? new AWS.S3({
          region: 'eu-west-1',
          s3ForcePathStyle: true,
          endpoint: `http://${process.env['CROWD_S3_HOST']}:${process.env['CROWD_S3_PORT']}`,
          apiVersion: '2012-10-17',
        })
      : new AWS.S3({ apiVersion: '2012-10-17' })
}

export async function uploadToS3(key: string, body: unknown): Promise<string> {
  try {
    await s3
      .putObject({
        Bucket: `${process.env['CROWD_S3_MICROSERVICES_ASSETS_BUCKET']}-${getEnv()}`,
        Key: key,
        Body: body,
      })
      .promise()
  } catch (err) {
    throw new Error(err)
  }

  return `https://${process.env['CROWD_S3_MICROSERVICES_ASSETS_BUCKET']}-${getEnv()}.s3.${
    process.env['CROWD_S3_AWS_REGION']
  }.amazonaws.com/${key}`
}
