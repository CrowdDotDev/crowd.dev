export const up = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.addColumn('conversationSettings', 'autoPublish', Sequelize.DataTypes.JSONB)
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

export const down = async (queryInterface) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.removeColumn('conversationSettings', 'autoPublish')
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
