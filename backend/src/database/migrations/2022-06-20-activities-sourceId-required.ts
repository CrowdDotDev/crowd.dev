export const up = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    queryInterface.changeColumn('activities', 'sourceId', {
      type: Sequelize.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    })
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

export const down = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    queryInterface.changeColumn('activities', 'sourceId', {
      type: Sequelize.TEXT,
      allowNull: true,
    })
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
