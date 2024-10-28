import { Hash } from '@aws-sdk/hash-node'
import { HttpRequest } from '@aws-sdk/protocol-http'
import { S3RequestPresigner } from '@aws-sdk/s3-request-presigner'
import { parseUrl } from '@aws-sdk/url-parser'
import { formatUrl } from '@aws-sdk/util-format-url'

import { ResultS3Upload } from '../types/s3'

/*
getPresignedUrl is a Temporal that returns a public S3 pre-signed URL gievn a
orivate object URL.
*/
export async function getPresignedUrl(input: ResultS3Upload): Promise<ResultS3Upload> {
  let presignedUrl: string
  try {
    const awsS3ObjectUrl = parseUrl(input.link)

    const presigner = new S3RequestPresigner({
      credentials: {
        accessKeyId: process.env['CROWD_S3_AWS_ACCESS_KEY_ID'],
        secretAccessKey: process.env['CROWD_S3_AWS_SECRET_ACCESS_KEY'],
      },
      region: process.env['CROWD_S3_AWS_REGION'],
      sha256: Hash.bind(null, 'sha256'),
    })

    const httpRequest = new HttpRequest({
      ...awsS3ObjectUrl,
      method: 'GET',
    })

    if (process.env['CROWD_S3_ENDPOINT']) {
      // Ensure the correct endpoint is used
      httpRequest.hostname = new URL(process.env['CROWD_S3_ENDPOINT']).hostname
    }

    presignedUrl = formatUrl(await presigner.presign(httpRequest, { expiresIn: 3600 }))
  } catch (err) {
    throw new Error(err)
  }

  return {
    link: presignedUrl,
  }
}
