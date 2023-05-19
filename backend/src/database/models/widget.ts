import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const widget = sequelize.define(
    'widget',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      title: {
        type: DataTypes.TEXT,
      },
      settings: {
        type: DataTypes.JSONB,
      },
      cache: {
        type: DataTypes.JSONB,
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
          where: {
            deletedAt: null,
          },
        },
      ],
      timestamps: true,
      paranoid: true,
    },
  )

  widget.associate = (models) => {
    models.widget.belongsTo(models.report, {
      as: 'report',
    })

    models.widget.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    })

    models.widget.belongsTo(models.segment, {
      as: 'segment',
      foreignKey: {
        allowNull: false,
      },
    })

    models.widget.belongsTo(models.user, {
      as: 'createdBy',
    })

    models.widget.belongsTo(models.user, {
      as: 'updatedBy',
    })
  }

  return widget
}
