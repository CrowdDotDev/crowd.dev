export const up = async (queryInterface) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.removeConstraint('activities', 'activities_communityMemberId_fkey', {
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
      onUpdate: 'CASCADE',
      transaction,
    })
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

export const down = async (queryInterface) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.removeConstraint('activities', 'activities_communityMemberId_fkey', {
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
      onUpdate: 'CASCADE',
      transaction,
    })
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
