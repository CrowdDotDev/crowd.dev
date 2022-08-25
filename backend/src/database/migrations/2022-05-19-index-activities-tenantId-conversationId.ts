export const up = async (queryInterface) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.sequelize.query(
      'CREATE INDEX "activities_conversationId_tenantId" ON "activities" ("conversationId", "tenantId")',
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
    await queryInterface.sequelize.query('DROP INDEX "activities_conversationId_tenantId"')
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
