import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import { QueryTypes } from 'sequelize'
import * as fs from 'fs'
import path from 'path'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import TenantService from '@/services/tenantService'
import OrganizationService from '@/services/organizationService'
import getUserContext from '@/database/utils/getUserContext'
import { IRepositoryOptions } from '@/database/repositories/IRepositoryOptions'
import {
  MergeActionState,
  MergeActionType,
  MergeActionsRepository,
} from '@/database/repositories/mergeActionsRepository'
import { CubeJsService } from '@crowd/cubejs'

/* eslint-disable no-console */

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const options = [
  {
    name: 'tenant',
    alias: 't',
    type: String,
    description: 'The unique ID of tenant',
  },
  {
    name: 'allTenants',
    alias: 'a',
    type: Boolean,
    defaultValue: false,
    description: 'Set this flag to merge similar organizations for all tenants.',
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
    header: 'Merge organizations with similarity higher than given threshold.',
    content: 'Merge organizations with similarity higher than given threshold.',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help || (!parameters.tenant && !parameters.allTenants)) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()

    let tenantIds

    if (parameters.allTenants) {
      tenantIds = (await TenantService._findAndCountAllForEveryUser({})).rows.map((t) => t.id)
    } else if (parameters.tenant) {
      tenantIds = parameters.tenant.split(',')
    } else {
      tenantIds = []
    }

    for (const tenantId of tenantIds) {
        const cjs = new CubeJsService()
        await cjs.init(tenantId, [])
    }

    process.exit(0)
  })
}
