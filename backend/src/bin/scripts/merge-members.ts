import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { getServiceLogger } from '@crowd/logging'
import MemberRepository from '../../database/repositories/memberRepository'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import MemberService from '../../services/memberService'

/* eslint-disable no-console */

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const log = getServiceLogger()

const options = [
  {
    name: 'originalId',
    alias: 'o',
    typeLabel: '{underline originalId}',
    type: String,
    description:
      'The unique ID of a member that will be kept. The other will be merged into this one.',
  },
  {
    name: 'targetId',
    alias: 't',
    typeLabel: '{underline targetId}',
    type: String,
    description:
      'The unique ID of a member that will be merged into the first one. This one will be destroyed. You can provide multiple ids here separated by comma.',
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
    header: 'Merge two members',
    content: 'Merge two members so that only one remains. The other one will be destroyed.',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help || !parameters.originalId || !parameters.targetId) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const originalId = parameters.originalId
    const targetIds = parameters.targetId.split(',')

    const options = await SequelizeRepository.getDefaultIRepositoryOptions()

    const originalMember = await MemberRepository.findById(originalId, options, true, true, true)
    options.currentTenant = { id: originalMember.tenantId }

    for (const targetId of targetIds) {
      const targetMember = await MemberRepository.findById(targetId, options, true, true, true)

      if (originalMember.tenantId !== targetMember.tenantId) {
        log.error(
          `Members ${originalId} and ${targetId} are not from the same tenant. Will not merge!`,
        )
      } else {
        log.info(`Merging ${targetId} into ${originalId}...`)
        const service = new MemberService(options)
        try {
          await service.merge(originalId, targetId)
        } catch (err) {
          log.error(`Error merging members: ${err.message}`)
          process.exit(1)
        }
      }
    }

    process.exit(0)
  })
}
