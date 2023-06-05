import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const automation = sequelize.define(
    'automation',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(80),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      name: {
        type: DataTypes.STRING(255),
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
      settings: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING(80),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
    },
    {
      indexes: [
        {
          fields: ['type', 'tenantId', 'trigger', 'state'],
        },
      ],
      timestamps: true,
    },
  )

  automation.associate = (models) => {
    models.automation.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })

    models.automation.belongsTo(models.user, {
      as: 'createdBy',
    })

    models.automation.belongsTo(models.user, {
      as: 'updatedBy',
    })
  }

  return automation
}
