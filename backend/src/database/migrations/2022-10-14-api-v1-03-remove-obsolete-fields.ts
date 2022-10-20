export const up = async (queryInterface) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    // members.crowdInfo
    await queryInterface.removeColumn('members', 'crowdInfo', { transaction })

    // members.location
    await queryInterface.removeColumn('members', 'location', { transaction })

    // members.signals
    await queryInterface.removeColumn('members', 'signals', { transaction })

    // members.type
    await queryInterface.removeColumn('members', 'type', { transaction })

    // members.bio
    await queryInterface.removeColumn('members', 'bio', { transaction })

    // members.info
    await queryInterface.removeColumn('members', 'info', { transaction })

    // members.organisation
    await queryInterface.removeColumn('members', 'organisation', { transaction })

    // activities.info
    await queryInterface.removeColumn('activities', 'info', { transaction })

    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

export const down = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    // recreate fields

    // members.crowdInfo
    await queryInterface.addColumn(
      'members',
      'crowdInfo',
      { type: Sequelize.JSONB, defaultValue: {} },
      { transaction },
    )

    // members.location
    await queryInterface.addColumn(
      'members',
      'location',
      {
        type: Sequelize.TEXT,
      },
      { transaction },
    )

    // members.signals
    await queryInterface.addColumn(
      'members',
      'signals',
      {
        type: Sequelize.TEXT,
      },
      { transaction },
    )

    // members.type
    await queryInterface.addColumn(
      'members',
      'type',
      {
        type: Sequelize.TEXT,
      },
      { transaction },
    )

    // members.bio
    await queryInterface.addColumn(
      'members',
      'bio',
      {
        type: Sequelize.TEXT,
      },
      { transaction },
    )

    // members.info
    await queryInterface.addColumn(
      'members',
      'info',
      { type: Sequelize.JSONB, defaultValue: {} },
      { transaction },
    )

    // members.organisation
    await queryInterface.addColumn(
      'members',
      'organisation',
      {
        type: Sequelize.TEXT,
      },
      { transaction },
    )

    // activities.info
    await queryInterface.addColumn(
      'activities',
      'info',
      { type: Sequelize.JSONB, defaultValue: {} },
      { transaction },
    )

    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
