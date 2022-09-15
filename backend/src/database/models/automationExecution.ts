import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const automationExecution = sequelize.define(
    'automationExecution',
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
      timestamps: false,
      paranoid: false,
    },
  )

  automationExecution.associate = (models) => {
    models.automationExecution.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })

    models.automationExecution.belongsTo(models.automation, {
      as: 'automation',
      foreignKey: {
        allowNull: false,
      },
    })
  }

  return automationExecution
}
