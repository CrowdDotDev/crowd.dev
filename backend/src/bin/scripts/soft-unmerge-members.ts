import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { QueryTypes } from 'sequelize'
import { databaseInit } from '@/database/databaseConnection'
import { randomUUID } from 'crypto'

/* eslint-disable no-console */

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const options = [
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Print this usage guide.',
  },
  {
    name: 'memberId',
    alias: 'm',
    type: String,
    description: 'Id of the member that will be used for unmerging',
  },
  {
    name: 'platform',
    alias: 'p',
    type: String,
    description: 'Identity platform to be unmerged',
  },
  {
    name: 'username',
    alias: 'u',
    type: String,
    description: 'Identity username to be unmerged',
  },
]
const sections = [
  {
    content: banner,
    raw: true,
  },
  {
    header: `Unmerge a member from another member using data we have`,
    content: 'Unmerge a member from another member using data we have',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help || !parameters.memberId || !parameters.platform || !parameters.username) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const prodDb = await databaseInit()

    console.log('Succesfully connected to both databases!')

    // find if member exists in prod db
    const memberResult = await prodDb.sequelize.query(
      `select * from members where id = '${parameters.memberId}';
        `,
      {
        useMaster: true,
      },
    )

    const member = memberResult?.[0]?.[0]

    if (member.id !== parameters.memberId) {
      console.log(`Member ${parameters.memberId} not found in db!`)
      return
    }

    const identityToProcess = {
      username: parameters.username,
      platform: parameters.platform,
    }

    console.log('Identity to process: ', { identityToProcess })

    // find identity given exists
    const identityExists = await prodDb.sequelize.query(
      `select "memberId" from "memberIdentities" mi
       where mi.username = '${identityToProcess.username}' and mi.platform = '${identityToProcess.platform}' and "tenantId" = '${member.tenantId}' and "memberId" = '${parameters.memberId}';
    `,
      {
        useMaster: true,
      },
    )

    let tx

    try {
      // create a transaction
      tx = await prodDb.sequelize.transaction()
      const id = randomUUID()

      console.log(
        `Unmerging member identity [${identityToProcess.platform}, ${identityToProcess.username}] from member ${parameters.memberId}`,
      )
      // create the merged member
      await prodDb.sequelize.query(
        `insert into members (
                "id", 
                "usernameOld", 
                "attributes", 
                "displayName", 
                "emails", 
                "score", 
                "joinedAt", 
                "importHash", 
                "reach", 
                "createdAt", 
                "updatedAt", 
                "deletedAt", 
                "tenantId", 
                "createdById", 
                "updatedById", 
                "lastEnriched", 
                "contributions", 
                "enrichedBy", 
                "weakIdentities", 
                "searchSyncedAt", 
                "manuallyCreated")
                VALUES (
                  :id, 
                  :usernameOld, 
                  :attributes,
                  :displayName,
                  :emails,
                  :score,
                  :joinedAt,
                  :importHash,
                  :reach,
                  :createdAt,
                  :updatedAt,
                  :deletedAt,
                  :tenantId,
                  :createdById,
                  :updatedById,
                  :lastEnriched,
                  :contributions,
                  :enrichedBy,
                  :weakIdentities,
                  :searchSyncedAt,
                  :manuallyCreated)`,
        {
          replacements: {
            id,
            usernameOld: identityToProcess.username,
            attributes: '{}', // TODO: think about this
            displayName: identityToProcess.username,
            emails: '{}', // TODO: think about this
            score: 0,
            joinedAt: new Date().toISOString(), // TODO: we need to set the first activity date here,
            importHash: null,
            reach: '{}',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
            tenantId: member.tenantId,
            createdById: null,
            updatedById: null,
            lastEnriched: null,
            contributions: '{}',
            enrichedBy: '{}',
            weakIdentities: '{}',
            searchSyncedAt: null,
            manuallyCreated: false,
          },
          type: QueryTypes.INSERT,
          transaction: tx,
        },
      )
      console.log(`Member row for ${id} created!`)

      console.log(`Moving identities into ${id}!`)

      // update identitities to point to the deleted member
      await prodDb.sequelize.query(
        `
              update "memberIdentities" 
              set "memberId" = :deletedMemberId 
              where 
                  "memberId" = :oldMemberId
                  and "tenantId" = :tenantId
                  and (platform = :platform and username = :username)`,
        {
          replacements: {
            oldMemberId: parameters.memberId,
            deletedMemberId: id,
            tenantId: member.tenantId,
            platform: identityToProcess.platform,
            username: identityToProcess.username,
          },
          type: QueryTypes.UPDATE,
          transaction: tx,
        },
      )

      console.log(`Identities unmerged from ${parameters.memberId} to ${id}!`)

       // we can't really update the member organizations because we don't have the data for it, so we're skipping it

      // update activities that belonged to the deleted member
      await prodDb.sequelize.query(
        `
              update "activities" 
              set "memberId" = :deletedMemberId 
              where 
              platform = :platform 
              and username = :username
              and "memberId" = :memberId`,
        {
          replacements: {
            deletedMemberId: id,
            platform: identityToProcess.platform,
            username: identityToProcess.username,
            memberId: parameters.memberId,
          },
          type: QueryTypes.UPDATE,
          transaction: tx,
        },
      )


      // TODO:: find the first activity date, and set members.joinedAt to that date
      const result = await prodDb.sequelize.query(
        `
              select min(timestamp) as "joinedAt" from "activities" where "memberId" = :deletedMemberId
              and "tenantId" = :tenantId
              and timestamp > '1970-01-01`,
        {
          replacements: {
            deletedMemberId: id,
          },
          type: QueryTypes.SELECT,
        },
      )

      if (result[0].joinedAt) {
        console.log(`Setting member.joinedAt to  ${result[0].joinedAt}`)
        await prodDb.sequelize.query(
          `
                    update "members" 
                    set "joinedAt" = :joinedAt 
                    where 
                    id = :id`,
          {
            replacements: {
              id,
              joinedAt: result[0].joinedAt,
            },
            type: QueryTypes.UPDATE,
            transaction: tx,
          },
        )
      }

      // TODO:: Think about attributes

      // TODO:: sync both members to opensearch

      await tx.commit()
      console.log(`Member ${id} unmerged from member ${parameters.memberId}`)
    } catch (e) {
      console.log(e)
      if (tx) {
        console.log('Rolling back transaction!')
        await tx.rollback()
      }
    }

    process.exit(0)
  })
}
