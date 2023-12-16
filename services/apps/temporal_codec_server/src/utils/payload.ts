import * as proto from '@temporalio/proto'

import { Payload, JSONPayload } from '../types/payload'

/**
 * Helper function to convert a valid proto JSON to a payload object.
 *
 * This method will be part of the SDK when it supports proto JSON serialization.
 */
export function fromJSON({ metadata, data }: JSONPayload): Payload {
  return {
    metadata:
      metadata &&
      Object.fromEntries(
        Object.entries(metadata).map(([k, v]): [string, Uint8Array] => [
          k,
          Buffer.from(v, 'base64'),
        ]),
      ),
    data: data ? Buffer.from(data, 'base64') : undefined,
  }
}

/**
 * Helper function to convert a payload object to a valid proto JSON.
 *
 * This method will be part of the SDK when it supports proto JSON serialization.
 */
export function toJSON({ metadata, data }: proto.temporal.api.common.v1.IPayload): JSONPayload {
  return {
    metadata:
      metadata &&
      Object.fromEntries(
        Object.entries(metadata).map(([k, v]): [string, string] => [
          k,
          Buffer.from(v).toString('base64'),
        ]),
      ),
    data: data ? Buffer.from(data).toString('base64') : undefined,
  }
}
