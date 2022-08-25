export const up = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.createTable('eagleEyeContents', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },

      sourceId: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },

      vectorId: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      keywords: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
        default: [],
      },
      status: {
        type: Sequelize.STRING(255),
        validate: {
          isIn: [['engaged', 'rejected']],
        },
        defaultValue: null,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      text: {
        type: Sequelize.TEXT,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      platform: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },

      similarityScore: {
        type: Sequelize.FLOAT,
      },

      userAttributes: {
        type: Sequelize.JSONB,
        default: {},
      },

      postAttributes: {
        type: Sequelize.JSONB,
        default: {},
      },

      importHash: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
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
    await queryInterface.dropTable('eagleEyeContents')
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
