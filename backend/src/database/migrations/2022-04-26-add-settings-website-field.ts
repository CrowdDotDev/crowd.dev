export const up = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.removeColumn('settings', 'theme')
    await queryInterface.addColumn('settings', 'website', Sequelize.DataTypes.STRING)
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

export const down = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.removeColumn('settings', 'website')
    await queryInterface.addColumn('settings', 'theme', Sequelize.DataTypes.STRING)
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
