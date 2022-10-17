import { QueryTypes } from 'sequelize'
import SequelizeRepository from '../../repositories/sequelizeRepository'

export default async () => {
  console.time('remove-crowdUsername-time')

  const options = await SequelizeRepository.getDefaultIRepositoryOptions()

  const memberCountQuery = `select count(*) from members m `

  const memberCount = (
    await options.database.sequelize.query(memberCountQuery, {
      type: QueryTypes.SELECT,
    })
  )[0].count

  let transformedMemberCount = 0

  const totalMembersCount = await getMembersCount(options.database.sequelize)
  let currentMemberCount = 0
  let currentOffset = 0

  while (currentMemberCount < totalMembersCount) {
    const LIMIT = 200000
    let updateMembers = []
    let splittedBulkMembers = []
    const members = await getMembers(options.database.sequelize, LIMIT, currentOffset)

    for (const member of members) {
      if (member.username.crowdUsername) {
        delete member.username.crowdUsername
      }

      updateMembers.push(member)

      transformedMemberCount += 1
      if (transformedMemberCount % 1000 === 0) {
        console.log(`transforming members: ${transformedMemberCount}/${memberCount}`)
      }
    }

    const MEMBER_CHUNK_SIZE = 25000

    if (updateMembers.length > MEMBER_CHUNK_SIZE) {
      const rawLength = updateMembers.length
      splittedBulkMembers = []

      while (updateMembers.length > MEMBER_CHUNK_SIZE) {
        splittedBulkMembers.push(updateMembers.slice(0, MEMBER_CHUNK_SIZE))
        updateMembers = updateMembers.slice(MEMBER_CHUNK_SIZE)
      }

      // push last leftover chunk
      if (updateMembers.length > 0) {
        splittedBulkMembers.push(updateMembers)
      }

      let counter = MEMBER_CHUNK_SIZE
      for (const memberChunk of splittedBulkMembers) {
        console.log(`updating member chunk ${counter}/${rawLength}`)

        await options.database.member.bulkCreate(memberChunk, {
          updateOnDuplicate: ['username'],
        })

        counter += MEMBER_CHUNK_SIZE
      }
    } else {
      await options.database.member.bulkCreate(updateMembers, {
        updateOnDuplicate: ['username'],
      })
    }

    currentMemberCount += members.length
    currentOffset += members.length
  }

  console.timeEnd('remove-crowdUsername-time')

}

async function getMembers(seq, limit, offset) {
  const membersQuery = `
        select * from members m 
        ORDER  BY m."createdAt" DESC
        OFFSET :offset
        LIMIT  :limit
    `
  const membersQueryParameters: any = {
    offset,
    limit,
  }

  return seq.query(membersQuery, {
    replacements: membersQueryParameters,
    type: QueryTypes.SELECT,
  })
}

async function getMembersCount(seq) {
  const membersCountQuery = `
        select count(*) from members m
    `

  const membersCount = (
    await seq.query(membersCountQuery, {
      type: QueryTypes.SELECT,
    })
  )[0].count

  return membersCount
}
