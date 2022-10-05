import { QueryInterface } from 'sequelize/types'

export const up = async (queryInterface: QueryInterface, sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    // rename tables
    await queryInterface.renameTable('communityMembers', 'members')
    await queryInterface.renameTable('communityMemberTags', 'memberTags')
    await queryInterface.renameTable('communityMemberToMerge', 'memberToMerge')
    await queryInterface.renameTable('communityMemberNoMerge', 'memberNoMerge')

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

export const down = async (queryInterface: QueryInterface) => {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.renameTable('members', 'communityMembers')
    await queryInterface.renameTable('memberTags', 'communityMemberTags')
    await queryInterface.renameTable('memberToMerge', 'communityMemberToMerge')
    await queryInterface.renameTable('memberNoMerge', 'communityMemberNoMerge')


    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
