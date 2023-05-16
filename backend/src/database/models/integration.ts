import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const integration = sequelize.define(
    'integration',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      platform: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.TEXT,
      },
      limitCount: {
        type: DataTypes.INTEGER,
      },
      limitLastResetAt: {
        type: DataTypes.DATE,
      },
      token: {
        type: DataTypes.TEXT,
      },
      refreshToken: {
        type: DataTypes.TEXT,
      },
      settings: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      integrationIdentifier: {
        type: DataTypes.TEXT,
      },
      importHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: [0, 255],
        },
      },
      emailSentAt: {
        type: DataTypes.DATE,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['importHash', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },
        {
          unique: false,
          fields: ['integrationIdentifier'],
        },
      ],
      timestamps: true,
      paranoid: true,
    },
  )

  integration.associate = (models) => {
    models.integration.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })

    models.integration.belongsTo(models.segment, {
      as: 'segment',
      foreignKey: {
        allowNull: false,
      },
    })

    models.integration.belongsTo(models.user, {
      as: 'createdBy',
    })

    models.integration.belongsTo(models.user, {
      as: 'updatedBy',
    })
  }

  return integration
}
