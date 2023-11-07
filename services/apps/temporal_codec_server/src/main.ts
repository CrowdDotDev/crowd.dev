import express from 'express'
import cors from 'cors'

import { EncryptionCodec } from '@crowd/temporal'
import { Config, Service } from '@crowd/archetype-standard'

import { Body } from './types/payload'
import { fromJSON, toJSON } from './utils/payload'

const config: Config = {
  envvars: ['CROWD_TEMPORAL_ENCRYPTION_KEY_ID', 'CROWD_TEMPORAL_ENCRYPTION_KEY'],
  producer: {
    enabled: false,
  },
  temporal: {
    enabled: false,
  },
  redis: {
    enabled: false,
  },
}

export const svc = new Service(config)

setImmediate(async () => {
  await svc.init()

  const codec = await EncryptionCodec.create(process.env['CROWD_TEMPORAL_ENCRYPTION_KEY_ID'])

  const app = express()
  app.use(cors({ allowedHeaders: ['x-namespace', 'content-type'] }))
  app.use(express.json())

  app.post('/decode', async (req, res) => {
    try {
      const { payloads: raw } = req.body as Body
      const encoded = raw.map(fromJSON)
      const decoded = await codec.decode(encoded)
      const payloads = decoded.map(toJSON)
      res.json({ payloads }).end()
    } catch (err) {
      console.error('Error in /decode', err)
      res.status(500).end('Internal server error')
    }
  })

  app.post('/encode', async (req, res) => {
    try {
      const { payloads: raw } = req.body as Body
      const decoded = raw.map(fromJSON)
      const encoded = await codec.encode(decoded)
      const payloads = encoded.map(toJSON)
      res.json({ payloads }).end()
    } catch (err) {
      console.error('Error in /encode', err)
      res.status(500).end('Internal server error')
    }
  })

  await new Promise<void>((resolve, reject) => {
    app.listen(8888, resolve)
    app.on('error', reject)
  })

  console.log(`Codec server listening on port 8888`)
})
