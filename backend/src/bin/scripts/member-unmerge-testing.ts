/* eslint-disable no-console */

/* eslint-disable import/no-extraneous-dependencies */
import axios from 'axios'
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import { detailedDiff } from 'deep-object-diff'
import * as fs from 'fs'
import path from 'path'
import { QueryTypes } from 'sequelize'

import { timeout } from '@crowd/common'
import { MemberIdentityType } from '@crowd/types'

import { databaseInit } from '@/database/databaseConnection'

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const options = [
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Print this usage guide.',
  },
  {
    name: 'primaryId',
    alias: 'p',
    type: String,
    description: 'Primary member id, other member will be merged into this one.',
  },
  {
    name: 'secondaryId',
    alias: 's',
    type: String,
    description: 'Secondary member id, this one will be merged into primary member.',
  },
]
const sections = [
  {
    content: banner,
    raw: true,
  },
  {
    header: `Merges two members, then unmerges these and cross checks unmerge result with original data.`,
    content:
      'Merges two members, then unmerges these and cross checks unmerge result with original data.',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

const getMember = async (id: string, db: any) =>
  (
    await db.sequelize.query(`select * from members where id = :id`, {
      replacements: { id },
      type: QueryTypes.SELECT,
    })
  )[0]

const getMemberOrganizations = async (memberId: string, db: any) =>
  db.sequelize.query(`select * from "memberOrganizations" where "memberId" = :memberId`, {
    replacements: { memberId },
    type: QueryTypes.SELECT,
  })

if (parameters.help || !parameters.primaryId || !parameters.secondaryId) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const prodDb = await databaseInit()

    console.log('Succesfully connected to both databases!')

    const originalPrimaryMember = await getMember(parameters.primaryId, prodDb)
    const originalPrimaryMemberOrganizations = await getMemberOrganizations(
      parameters.primaryId,
      prodDb,
    )

    const originalSecondaryMember = await getMember(parameters.secondaryId, prodDb)
    const originalSecondaryMemberOrganizations = await getMemberOrganizations(
      parameters.secondaryId,
      prodDb,
    )

    // find identities in secondary member, it'll be used for the unmerge operation
    const secondaryMemberIdentities = await prodDb.sequelize.query(
      `SELECT * FROM "memberIdentities" WHERE "memberId" = :primaryId and type = :type and "deletedAt" is null`,
      {
        replacements: { primaryId: parameters.secondaryId, type: MemberIdentityType.USERNAME },
        type: QueryTypes.SELECT,
      },
    )

    if (secondaryMemberIdentities.length === 0) {
      console.error(
        `No active USERNAME identities found for secondary member ${parameters.secondaryId}. Cannot proceed with merge/unmerge test.`,
      )

      process.exit(1)
    }

    const tenantId = secondaryMemberIdentities[0].tenantId

    const apiBearerToken = ''

    // make put axios request to http://localhost:8080/tenant/{{tenantId}}/member/${parameters.primaryId}/merge
    // with body { memberToMerge: parameters.secondaryId }
    // and headers { Authorization: `Bearer ${apiBearerToken}` }

    await axios.put(
      `http://api:8080/tenant/${tenantId}/member/${parameters.primaryId}/merge`,
      {
        memberToMerge: parameters.secondaryId,
      },
      {
        headers: {
          Authorization: `Bearer ${apiBearerToken}`,
        },
      },
    )

    console.log(`Merged members succesfully!`)
    console.log(`Waiting few seconds to let temporal workers finish async stuff...`)
    await timeout(10000)

    console.log(`Getting unmerge preview...`)
    const result = await axios.post(
      `http://api:8080/tenant/${tenantId}/member/${parameters.primaryId}/unmerge/preview`,
      {
        platform: secondaryMemberIdentities[0].platform,
        username: secondaryMemberIdentities[0].value,
      },
      {
        headers: {
          Authorization: `Bearer ${apiBearerToken}`,
        },
      },
    )

    console.log(`Unmerging members using preview payload...`)
    await axios.post(
      `http://api:8080/tenant/${tenantId}/member/${parameters.primaryId}/unmerge`,
      result.data,
      {
        headers: {
          Authorization: `Bearer ${apiBearerToken}`,
        },
      },
    )

    const unmergedPrimaryMember = await getMember(parameters.primaryId, prodDb)
    const unmergedPrimaryMemberOrganizations = await getMemberOrganizations(
      parameters.primaryId,
      prodDb,
    )

    const unmergedSecondaryMember = await getMember(parameters.secondaryId, prodDb)
    const unmergedSecondaryMemberOrganizations = await getMemberOrganizations(
      parameters.secondaryId,
      prodDb,
    )

    console.log(
      `****************************************************************************************`,
    )
    console.log(
      `***************************** Member field differences *********************************`,
    )
    console.log(
      `****************************************************************************************`,
    )

    console.log('Generating diff between original and unmerged primary member...')
    console.log(detailedDiff(originalPrimaryMember, unmergedPrimaryMember))

    console.log('Generating diff between original and unmerged secondary member...')
    console.log(detailedDiff(originalSecondaryMember, unmergedSecondaryMember))

    console.log(
      `****************************************************************************************`,
    )
    console.log(
      `************************** Member Organization differences *****************************`,
    )
    console.log(
      `****************************************************************************************`,
    )

    console.log('Generating diff between original and unmerged primary member organizations...')
    console.log(
      detailedDiff(originalPrimaryMemberOrganizations, unmergedPrimaryMemberOrganizations),
    )

    console.log('Generating diff between original and unmerged secondary member...')
    console.log(
      detailedDiff(originalSecondaryMemberOrganizations, unmergedSecondaryMemberOrganizations),
    )

    process.exit(0)
  })
}
