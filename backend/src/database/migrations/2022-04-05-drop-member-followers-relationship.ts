module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.dropTable('communityMemberFollowers')
      return transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.createTable('communityMemberFollowers', {
        createdAt: {
          type: Sequelize.DataTypes.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DataTypes.DATE,
          allowNull: false,
        },
        communityMemberId: {
          type: Sequelize.DataTypes.UUID,
          allowNull: false,
        },
        followerId: {
          type: Sequelize.DataTypes.UUID,
          allowNull: false,
        },
      })
      return transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },
}
