import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const automationExecutionHistory = sequelize.define(
    'automationExecutionHistory',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      automationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(80),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      trigger: {
        type: DataTypes.STRING(80),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      state: {
        type: DataTypes.STRING(80),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      error: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      executedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      eventId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      payload: {
        type: DataTypes.JSON,
        allowNull: false,
      },
    },
    {
      indexes: [
        {
          fields: ['automationId'],
        },
      ],
      timestampts: false,
      paranoid: false,
    },
  )

  automationExecutionHistory.associate = (models) => {
    models.automationExecutionHistory.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })

    models.automationExecutionHistory.belongsTo(models.automation, {
      as: 'automation',
      foreignKey: {
        allowNull: false,
      },
    })
  }

  return automationExecutionHistory
}
