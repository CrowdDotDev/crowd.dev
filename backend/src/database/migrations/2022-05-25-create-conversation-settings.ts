export const up = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.createTable('conversationSettings', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },

      customUrl: {
        type: Sequelize.STRING,
      },

      logoUrl: {
        type: Sequelize.STRING,
      },

      faviconUrl: {
        type: Sequelize.STRING,
      },

      theme: {
        type: Sequelize.JSONB,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },

      tenantId: {
        allowNull: false,
        type: Sequelize.UUID,
      },

      createdById: {
        allowNull: false,
        type: Sequelize.UUID,
      },

      updatedById: {
        type: Sequelize.UUID,
      },
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
    await queryInterface.dropTable('conversationSettings')
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
