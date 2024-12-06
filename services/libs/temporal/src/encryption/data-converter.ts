import { DataConverter } from '@temporalio/common'

import { EncryptionCodec } from './encryption-codec'

let dataConverter: DataConverter

export async function getDataConverter(keyId: string): Promise<DataConverter> {
  if (!dataConverter) {
    dataConverter = await createDataConverter(keyId)
  }
  return dataConverter
}

async function createDataConverter(keyId: string): Promise<DataConverter> {
  return {
    payloadCodecs: [await EncryptionCodec.create(keyId)],
  }
}
