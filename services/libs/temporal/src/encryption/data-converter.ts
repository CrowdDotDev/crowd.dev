import { DataConverter } from '@temporalio/common'
import { EncryptionCodec } from './encryption-codec'

let dataConverterPromise: Promise<DataConverter>

export async function getDataConverter(): Promise<DataConverter> {
  if (!dataConverterPromise) {
    dataConverterPromise = createDataConverter()
  }
  return await dataConverterPromise
}

async function createDataConverter(): Promise<DataConverter> {
  const keyId = process.env['CROWD_TEMPORAL_ENCRYPTION_KEY_ID']
  return {
    payloadCodecs: [await EncryptionCodec.create(keyId)],
  }
}
