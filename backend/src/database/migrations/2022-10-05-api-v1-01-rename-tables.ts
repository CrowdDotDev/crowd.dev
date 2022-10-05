import { QueryInterface } from 'sequelize/types'

export const up = async (queryInterface: QueryInterface, sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    // rename tables
    await queryInterface.renameTable('communityMembers', 'members', {
      transaction,
    })
    await queryInterface.renameTable('communityMemberTags', 'memberTags', {
      transaction,
    })
    await queryInterface.renameTable('communityMemberToMerge', 'memberToMerge', {
      transaction,
    })
    await queryInterface.renameTable('communityMemberNoMerge', 'memberNoMerge', {
      transaction,
    })

     // rename activities.communityMemberId and foreign key constaint name
     await queryInterface.removeConstraint('activities', 'activities_communityMemberId_fkey', {
      transaction,
    })
    await queryInterface.renameColumn('activities', 'communityMemberId', 'memberId', {
      transaction,
    })
    await queryInterface.addConstraint('activities', {
      type: 'foreign key',
      fields: ['memberId'],
      name: 'activities_memberId_fkey',
      references: {
        table: 'members',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    // rename memberToMerge.communityMemberId field to memberToMerge.memberId and update fk name
    await queryInterface.removeConstraint(
      'memberToMerge',
      'communityMemberToMerge_communityMemberId_fkey', {
        transaction,
      }
    )
    await queryInterface.renameColumn('memberToMerge', 'communityMemberId', 'memberId', {
      transaction,
    })
    await queryInterface.addConstraint('memberToMerge', {
      type: 'foreign key',
      fields: ['memberId'],
      name: 'memberToMerge_memberId_fkey',
      references: {
        table: 'members',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    // update fkname of toMergeId
    await queryInterface.removeConstraint('memberToMerge', 'communityMemberToMerge_toMergeId_fkey', {
      transaction,
    })
    await queryInterface.addConstraint('memberToMerge', {
      type: 'foreign key',
      fields: ['toMergeId'],
      name: 'memberToMerge_toMergeId_fkey',
      references: {
        table: 'members',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })


    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

export const down = async (queryInterface: QueryInterface) => {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.renameTable('members', 'communityMembers', {
      transaction,
    })
    await queryInterface.renameTable('memberTags', 'communityMemberTags', {
      transaction,
    })
    await queryInterface.renameTable('memberToMerge', 'communityMemberToMerge', {
      transaction,
    })
    await queryInterface.renameTable('memberNoMerge', 'communityMemberNoMerge', {
      transaction,
    })

    await queryInterface.removeConstraint('activities', 'activities_memberId_fkey', {
      transaction,
    })
    await queryInterface.renameColumn('activities', 'memberId', 'communityMemberId', {
      transaction,
    })
    await queryInterface.addConstraint('activities', {
      type: 'foreign key',
      fields: ['communityMemberId'],
      name: 'activities_communityMemberId_fkey',
      references: {
        table: 'communityMembers',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    await queryInterface.removeConstraint('communityMemberToMerge', 'memberToMerge_memberId_fkey', {
      transaction,
    })
    await queryInterface.renameColumn('memberToMerge', 'memberId', 'communityMemberId', {
      transaction,
    })
    await queryInterface.addConstraint('communityMemberToMerge', {
      type: 'foreign key',
      fields: ['communityMemberId'],
      name: 'communityMemberToMerge_communityMemberId_fkey',
      references: {
        table: 'communityMembers',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    await queryInterface.removeConstraint('memberToMerge', 'memberToMerge_toMergeId_fkey', {
      transaction,
    })
    await queryInterface.addConstraint('memberToMerge', {
      type: 'foreign key',
      fields: ['toMergeId'],
      name: 'communityMemberToMerge_toMergeId_fkey',
      references: {
        table: 'communityMembers',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
