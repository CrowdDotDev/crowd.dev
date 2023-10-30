import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import MemberEnrichmentService from '../../services/premium/enrichment/memberEnrichmentService'

/* eslint-disable no-console */

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const options = [
  {
    name: 'email',
    alias: 'e',
    type: String,
    description: 'Find member by given email',
  },
  {
    name: 'github_handle',
    alias: 'g',
    type: String,
    description: 'Find member by given github handle',
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
    header: 'Get member enrichment data from progai',
    content: 'Get member enrichment data from progai',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help || (!parameters.github_handle && !parameters.email)) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const opts = await SequelizeRepository.getDefaultIRepositoryOptions()

    if (parameters.github_handle) {
      const srv = new MemberEnrichmentService(opts)
      const data = await srv.getEnrichmentByGithubHandle(parameters.github_handle)
      console.log(data)
    }

    if (parameters.email) {
      const srv = new MemberEnrichmentService(opts)
      const data = await srv.getEnrichmentByEmail(parameters.email)
      console.log(data)
    }

    process.exit(0)
  })
}
