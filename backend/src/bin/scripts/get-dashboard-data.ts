import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import {
  CubeJsRepository,
  CubeJsService,
  CubeDimension,
  CubeMeasure,
  CubeOrderDirection,
} from '@crowd/cubejs'
import { getServiceLogger } from '@crowd/logging'

import moment from 'moment-timezone'
import { databaseInit } from '@/database/databaseConnection'

/* eslint-disable no-console */

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const log = getServiceLogger()

const options = [
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Print this usage guide.',
  },
  {
    name: 'tenantId',
    alias: 't',
    type: String,
    description: 'Tenant ID',
  },
  {
    name: 'segmentId',
    alias: 's',
    type: String,
    description: 'Segment ID',
  },
]
const sections = [
  {
    content: banner,
    raw: true,
  },
  {
    header: `Unmerge a member from another member using a snapshot db`,
    content: 'Unmerge a member from another member using a snapshot db',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help || !parameters.tenantId || !parameters.segmentId) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const db = await databaseInit()

    const cubejsService = new CubeJsService()

    await cubejsService.init(parameters.tenantId, [parameters.segmentId], log)

    const start = moment().subtract(6, 'days').startOf('day')

    const end = moment().endOf('day')

    console.log('START DATE: ')
    console.log(start.toISOString())
    console.log('END DATE: ')
    console.log(end.toISOString())

    const previousStartDate = moment().subtract(13, 'days').startOf('day')
    const previousEndDate = moment().subtract(7, 'days').endOf('day')

    console.log("PREVIOUS START DATE:")
    console.log(previousStartDate.toISOString())
    console.log("PREVIOUS END DATE: ")
    console.log(previousEndDate.toISOString())

    const data = await CubeJsRepository.getNewActivities(
      cubejsService,
      start,
      end,
      'day',
      [],
      {},
      { [CubeDimension.ACTIVITY_DATE]: CubeOrderDirection.ASC },
      true,
    )

    console.log(data)

    const data2 = await CubeJsRepository.getNewActivities(
      cubejsService,
      start,
      end,
      null,
      [CubeDimension.ACTIVITY_TYPE, CubeDimension.ACTIVITY_PLATFORM],
      {
        platform: 'github',
      },
      { [CubeMeasure.ACTIVITY_COUNT]: CubeOrderDirection.DESC },
      true,
    )

    console.log(data2)

    process.exit(0)
  })
}
