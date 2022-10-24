export const up = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.addColumn('conversationSettings', 'enabled', Sequelize.DataTypes.BOOLEAN)
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

export const down = async (queryInterface) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.dropColumn('conversationSettings', 'enabled')
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
