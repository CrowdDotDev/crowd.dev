export const up = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.addColumn('activities', 'sourceParentId', Sequelize.DataTypes.STRING)
    await queryInterface.sequelize.query(
      'CREATE INDEX "activities_sourceParentId_tenantId" ON "activities" ("sourceParentId", "tenantId")',
    )
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

export const down = async (queryInterface) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.removeColumn('activities', 'sourceParentId')
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
