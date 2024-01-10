import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { getNodejsWorkerEmitter } from '@/serverless/utils/serviceSQS'

/* eslint-disable no-console */

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const options = [
  {
    name: 'tenant',
    alias: 't',
    type: String,
    description:
      'The unique ID of that tenant that you would like to generate merge suggestions for.',
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Print this usage guide.',
  },
]
const sections = [
  {
    content: banner,
    raw: true,
  },
  {
    header: 'Generate merge suggestions for a tenant',
    content: 'Generate merge suggestions for a tenant',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help || !parameters.tenant) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const tenantIds = parameters.tenant.split(',')
    const emitter = await getNodejsWorkerEmitter()
    for (const tenantId of tenantIds) {
      await emitter.mergeSuggestions(tenantId)
    }

    process.exit(0)
  })
}
