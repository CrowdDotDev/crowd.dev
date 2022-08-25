import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const microservice = sequelize.define(
    'microservice',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      init: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      running: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      type: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      variant: {
        type: DataTypes.TEXT,
        validate: {
          isIn: [['default', 'premium']],
        },
        defaultValue: 'default',
      },
      settings: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      importHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: [0, 255],
        },
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['importHash', 'tenantId'],
        },
        {
          unique: true,
          fields: ['type', 'tenantId'],
        },
      ],
      timestamps: true,
    },
  )

  microservice.associate = (models) => {
    models.microservice.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })

    models.microservice.belongsTo(models.user, {
      as: 'createdBy',
    })

    models.microservice.belongsTo(models.user, {
      as: 'updatedBy',
    })
  }

  return microservice
}
