import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { QueryTypes } from 'sequelize'
import { databaseInit } from '@/database/databaseConnection'

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
  {
    name: 'snapshotDBHostname',
    alias: 's',
    type: String,
    description: 'Snapshot database hostname where members were not merged yet',
  },
]
const sections = [
  {
    content: banner,
    raw: true,
  },
  {
    header: `Unmerge a member from another member - This is a development script, never run it in k8s context!`,
    content:
      'Unmerge a member from another member - This is a development script, never run it in k8s context!',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (
  parameters.help ||
  !parameters.memberId ||
  !parameters.platform ||
  !parameters.username ||
  !parameters.snapshotDBHostname
) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const snapshotDb = await databaseInit(50000, true, parameters.snapshotDBHostname) // we should get a connection to the snapshot db to get the destroyed data
    const prodDb = await databaseInit()

    // find if member exists in prod db
    const memberResult = await snapshotDb.sequelize.query(
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

    // find memberId from snapshot db using identity
    const members = await snapshotDb.sequelize.query(
      `select "memberId" from "memberIdentities" mi
       where mi.username = '${identityToProcess.username}' and mi.platform = '${identityToProcess.platform}' and "tenantId" = '${member.tenantId}';
    `,
      {
        useMaster: true,
      },
    )

    const deletedMemberId = members?.[0]?.[0]?.memberId

    let tx

    try {
      if (deletedMemberId && deletedMemberId !== parameters.memberId) {
        // get the full member row
        const memberRow = await snapshotDb.sequelize.query(
          `select * from members where id = '${deletedMemberId}'`,
          {
            useMaster: true,
          },
        )

        const deletedMember = memberRow?.[0]?.[0]

        // create a transaction
        tx = await prodDb.sequelize.transaction()

        // check if deleted member still exists in prod db, if yes (highly unlikely, because when merging two members we delete the other one) we don't need to recreate the members row
        const result = await prodDb.sequelize.query(
          `
                select id from members m 
                where m.id = :deletedMemberId`,
          {
            replacements: {
              deletedMemberId,
            },
            type: QueryTypes.SELECT,
            transaction: tx,
          },
        )

        console.log(`Unmerging member ${deletedMemberId} from member ${parameters.memberId}`)
        if (result.length === 0 || result[0].length === 0) {
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
                ...deletedMember,
                usernameOld: deletedMember.usernameOld
                  ? JSON.stringify(deletedMember.usernameOld)
                  : null,
                attributes: deletedMember.attributes
                  ? JSON.stringify(deletedMember.attributes)
                  : null,
                reach: deletedMember.reach ? JSON.stringify(deletedMember.reach) : null,
                weakIdentities: deletedMember.weakIdentities
                  ? JSON.stringify(deletedMember.weakIdentities)
                  : null,
              },
              type: QueryTypes.INSERT,
              transaction: tx,
            },
          )
          console.log(`Member row for ${deletedMemberId} created!`)
        }

        console.log(`Moving identities into ${deletedMemberId}!`)

        // find identities of deleted member
        const result1 = await snapshotDb.sequelize.query(
          `
                select * from "memberIdentities" mi
                where mi."memberId" = :deletedMemberId;`,
          {
            replacements: {
              deletedMemberId,
            },
            type: QueryTypes.SELECT,
          },
        )

        const identityFilterPartial = result1
          .map((mi) => ` (username = '${mi.username}' and platform = '${mi.platform}') `)
          .join(' or ')

        // update identity to belong to found org
        await prodDb.sequelize.query(
          `
              update "memberIdentities" 
              set "memberId" = :deletedMemberId 
              where 
                  "memberId" = :oldMemberId
                  and "tenantId" = :tenantId
                  and (${identityFilterPartial})`,
          {
            replacements: {
              oldMemberId: parameters.memberId,
              deletedMemberId,
              tenantId: member.tenantId,
            },
            type: QueryTypes.UPDATE,
            transaction: tx,
          },
        )

        console.log(`Identities unmerged from ${parameters.memberId} to ${deletedMemberId}!`)

        // find memberOrganization rows that belonged to the deleted member
        const result2 = await snapshotDb.sequelize.query(
          `
              select * from "memberOrganizations" mo
              where mo."memberId" = :deletedMemberId;`,
          {
            replacements: {
              deletedMemberId,
            },
            type: QueryTypes.SELECT,
          },
        )

        const uuidValues = `${result2.map((res) => res.id).join("','")}`

        // find memberOrganization rows that doesn't exist anymore in prod db - we'll need to recreate those
        const result3 = await prodDb.sequelize.query(
          `
            select "memberOrganizationId"
            from unnest(array[${uuidValues}]) AS "memberOrganizationId"
            where not exists (
              select 1 from "memberOrganizations" WHERE id = "memberOrganizationId"::uuid
            );`,
          {
            type: QueryTypes.SELECT,
          },
        )

        const deletedMemberOrganizationIds = result3.map((r) => r.memberOrganizationId)

        // insert deleted member organization rows
        if (deletedMemberOrganizationIds && deletedMemberOrganizationIds.length > 0) {
          const insertValues = deletedMemberOrganizationIds
            .map((deletedMemberOrganizationId) => {
              // find the full row from the previous query result
              const row = result2.find((mi) => mi.id === deletedMemberOrganizationId)
              return `('${row.id}', '${row.createdAt}', '${row.updatedAt}', '${row.memberId}', '${row.organizationId}', '${row.dateStart}', '${row.dateEnd}', '${row.title}', '${row.source}', '${row.deletedAt}')`
            })
            .join(',')

          await prodDb.sequelize.query(
            `insert into "memberOrganizations" (
                    "id", 
                    "createdAt", 
                    "updatedAt", 
                    "memberId",
                    "organizationId",
                    "dateStart",
                    "dateEnd",
                    "title",
                    "source",
                    "deletedAt",
                    values ${insertValues}`,
            {
              type: QueryTypes.INSERT,
              transaction: tx,
            },
          )
        }

        // Obtain only the id's from the resulting objects array
        const idsBelongToMergedMember = result2.map((res) => res.id)

        // update the existing memberOrganization rows that was moved via merge
        await prodDb.sequelize.query(
          `
              update "memberOrganizations" 
              set "memberId" = :deletedMemberId 
              where 
              id in (:idsBelongToMergedMember)`,
          {
            replacements: {
              deletedMemberId,
              idsBelongToMergedMember,
            },
            type: QueryTypes.UPDATE,
            transaction: tx,
          },
        )

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
              deletedMemberId,
              platform: identityToProcess.platform,
              username: identityToProcess.username,
              memberId: parameters.memberId,
            },
            type: QueryTypes.UPDATE,
            transaction: tx,
          },
        )

        // find memberSegments that were deleted by the merge
        const result4 = await snapshotDb.sequelize.query(
          `
                select * from "memberSegments" where "memberId" = :deletedMemberId`,
          {
            replacements: {
              deletedMemberId,
            },
            type: QueryTypes.SELECT,
            transaction: tx,
          },
        )

        const memberSegmentInsertValues = result4
          .map((ms) => `('${ms.memberId}', '${ms.segmentId}', '${ms.tenantId}', '${ms.createdAt}')`)
          .join(',')
        // add restored member to memberSegments again
        await prodDb.sequelize.query(
          `
                    insert into "memberSegments" ("memberId", "segmentId", "tenantId", "createdAt")
                    values ${memberSegmentInsertValues}
                    on conflict do nothing`,
          {
            type: QueryTypes.INSERT,
            transaction: tx,
          },
        )

        await tx.commit()
        console.log(`Member ${deletedMemberId} unmerged from member ${parameters.memberId}`)
      }
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
