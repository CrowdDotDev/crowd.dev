module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.addColumn('communityMembers', 'reach', {
        type: Sequelize.DataTypes.JSONB,
        defaultValue: {
          total: -1,
        },
      })
      return transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.removeColumn('communityMembers', 'reach')
      return transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },
}
