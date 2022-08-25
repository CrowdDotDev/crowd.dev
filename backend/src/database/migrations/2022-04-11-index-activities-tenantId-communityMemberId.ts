export const up = async (queryInterface) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.sequelize.query(
      'CREATE INDEX "activities_communityMemberId_tenantId" ON "activities" ("communityMemberId", "tenantId")',
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
    await queryInterface.sequelize.query('DROP INDEX "activities_communityMemberId_tenantId"')
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
