export const up = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.addColumn('tenants', 'hasSampleData', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
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
    await queryInterface.removeColumn('tenants', 'hasSampleData')
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
